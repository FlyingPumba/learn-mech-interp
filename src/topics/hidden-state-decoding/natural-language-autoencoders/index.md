---
title: "Natural Language Autoencoders"
description: "Turning activations into readable explanations by jointly training a verbalizer and reconstructor, without labels that say what those activations encode."
order: 7
prerequisites:
  - title: "Activation Oracles"
    url: "/topics/activation-oracles/"
  - title: "Sparse Autoencoders"
    url: "/topics/sparse-autoencoders/"
glossary:
  - term: "Natural Language Autoencoder (NLA)"
    definition: "A pair of language models trained jointly to autoencode a target model's activation through a natural-language bottleneck. A verbalizer writes a text description of the activation and a reconstructor rebuilds the activation from that text. Training minimizes reconstruction error, with no labels for what the activation encodes."
  - term: "Activation Verbalizer (AV)"
    definition: "The encoder half of an NLA. A copy of the target model that receives an activation injected in place of a token embedding and generates a natural-language explanation of it."
  - term: "Activation Reconstructor (AR)"
    definition: "The decoder half of an NLA. A truncated copy of the target model that reads an explanation and maps it back to a reconstructed activation through a learned affine head."
---

## The cost of supervision

[Activation Oracles](/topics/activation-oracles/) and [LatentQA](/topics/latentqa/) can answer questions about an activation, but they learn from data where we already know the answer: a system prompt that fixes a persona, a context whose topic is labeled, a property we planted on purpose. That requirement is a quiet constraint. We can only teach a supervised verbalizer to report things we can already label, which narrows the training distribution and leans heavily on generalization to everything we never thought to ask {% cite "karvonen2025activationoracles" %}.

The unsupervised methods have the opposite problem. The [logit lens](/topics/logit-lens-and-tuned-lens/) projects an activation onto the vocabulary {% cite "nostalgebraist2020logitlens" %}, and [sparse autoencoders](/topics/sparse-autoencoders/) decompose it into a sparse sum of learned features {% cite "bricken2023monosemanticity" %}. Neither needs labels, but both express their answer as a weighted combination of atoms from a fixed dictionary (tokens or features), and an SAE feature still needs a separate interpretation step before a human can read it.

Natural Language Autoencoders, introduced by Fraser-Taliente, Kantamneni, Ong, and colleagues {% cite "frasertaliente2026nla" %}, try to get both properties at once: the open-ended discovery of an unsupervised objective, and output you can read directly because it is written in English.

## An autoencoder with a language bottleneck

The idea is to build an autoencoder whose bottleneck is a paragraph of natural language. One module reads an activation and writes a description of it. A second module reads that description and rebuilds the activation. If the description carries enough of what the activation encodes, the second module can reconstruct it, and the description is a readable account of the activation as a side effect.

<figure>
  <img src="images/nla_architecture.png" alt="Schematic of a Natural Language Autoencoder. On the left, a target model processes the tokens 'what are you hiding' and a single activation h_l is extracted from one token position. The activation vector feeds into the Activation Verbalizer, drawn as an encoder trapezoid, which outputs a natural-language description in quotes: 'User question with accusatory framing: what are you hiding begins a question that assumes the AI has secrets'. That description feeds into the Activation Reconstructor, drawn as a decoder trapezoid, which outputs a reconstructed activation h-hat_l. An arrow spanning the bottom reads: we minimize the squared L2 distance between h_l and h-hat_l.">
  <figcaption>A Natural Language Autoencoder. The activation verbalizer (AV) translates a target activation into a text description; the activation reconstructor (AR) recovers the original activation from that text alone. Training minimizes the squared distance between the original activation and its reconstruction. From Fraser-Taliente et al., <em>Natural Language Autoencoders Produce Unsupervised Explanations of LLM Activations</em>. {%- cite "frasertaliente2026nla" -%}</figcaption>
</figure>

> **Natural Language Autoencoder (NLA):** A verbalizer and reconstructor trained jointly to autoencode a target model's activation through a natural-language bottleneck. Training minimizes reconstruction error, with no labels for what the activation encodes.

> **Activation Verbalizer (AV):** The encoder. It takes an activation and generates a text explanation.

> **Activation Reconstructor (AR):** The decoder. It takes an explanation and produces a reconstructed activation.

The reconstruction objective does not explicitly reward readability or faithfulness. With a supervised warm start and a penalty that keeps the verbalizer nearby, the reported models produce text that human evaluators can often interpret. Those extra ingredients matter, and reconstruction alone does not certify the explanations.

## The Reconstruction Objective

Fix a target model $M$ and a layer $l$ whose activations $h_l \in \mathbb{R}^{d_\text{model}}$ we want to interpret. The AV defines a distribution over explanations $z$ given an activation, written $\text{AV}(z \mid h_l)$. The AR maps an explanation to a reconstruction $\hat{h}_l = \text{AR}(z)$. We train both to minimize the expected reconstruction error:

$$\mathcal{L} = \mathbb{E}_{h_l \sim \mathcal{H}} \; \mathbb{E}_{z \sim \text{AV}(\cdot \mid h_l)} \left[\, \lVert h_l - \text{AR}(z) \rVert_2^2 \,\right]$$

Here $\mathcal{H}$ is the distribution of layer-$l$ activations you get by running $M$ over a corpus of text. To read the loss on an interpretable scale, the paper reports the **fraction of variance explained**:

$$\text{FVE} = 1 - \frac{\mathcal{L}}{\mathbb{E}_{h_l \sim \mathcal{H}} \, \lVert h_l - \bar{h}_l \rVert_2^2}$$

An FVE of $0$ matches the mean-activation baseline, while an FVE of $1$ is perfect reconstruction on the evaluated distribution. In the reported recipe, activations are normalized to unit $L_2$ norm and the target layer is chosen in the middle-to-late network. Those are design choices, not a guarantee that such layers contain only abstract content.

## Two Language Models, Wired Back to Back

Both halves initialize from the target model. This gives them a vocabulary and representational starting point matched to the activation source, although training must still teach them the new activation-to-text and text-to-activation interfaces.

**The verbalizer** is a full copy of $M$. It runs on a fixed prompt that instructs it to describe an activation and contains one special placeholder token. To verbalize $h_l$, we scale it by a fixed constant $\alpha$ and insert it in place of the placeholder token's embedding, then sample from the model at temperature $1$ to get the explanation $z$. {% sidenote "The scale $\alpha$ is large, well above a typical token-embedding norm. The authors' working hypothesis is that a large injected vector propagates through the early layers relatively undisturbed until it reaches the depth at which the weights know how to read a layer-$l$ activation. A serviceable heuristic is to set $\alpha$ to roughly the 75th-percentile activation norm at the chosen layer." %}

**The reconstructor** is a copy of $M$ truncated to its first $l$ layers, since the reconstruction target lives at layer $l$ and the later layers are not needed. It wraps the explanation $z$ in a fixed prompt, runs it forward, and applies a learned affine map to the layer-$l$ activation at the final token to produce $\hat{h}_l$. That affine head is the only genuinely new parameter tensor in the system; everything else is initialized from the target model.

## Why Initialization Alone Is Not Enough

In the paper's ablations, initializing the AV and AR from $M$ without a warm start does not produce useful training. The AV has not learned to treat a layer activation as an input embedding, so its initial samples are poor and provide an unstable starting point for reinforcement learning.

The fix is a supervised warm-start on a summarization proxy task. Take pretraining-like text, truncate it at a random point, and record the layer-$l$ activation at the final token. Ask a strong model to write a short summary of what a language model reading that text would be attending to at that point. Then fine-tune the AV on (activation, summary) pairs and the AR on (summary, activation) pairs {% cite "frasertaliente2026nla" %}. {% sidenote "The summarization prompt deliberately leads the witness: rather than asking for a literal summary of the visible text, it asks the labeler to imagine the internal processing of a causal model predicting the next token. The goal is not ground truth, which we do not have, but to put the AV roughly in the right region before reinforcement learning takes over. The Claude-generated summaries have a recognizable style of short paragraphs with bolded topic headings, and that style persists all the way through training." %}

This warm-start typically reaches an FVE around $0.3$ to $0.4$ on its own. Its more important job is to make the AV speak fluent, on-topic English before the reconstruction objective starts pushing on it. We will see why that matters when we look at how the objective could otherwise be gamed.

## Training the Pair

After the warm-start, both modules are trained together to minimize the same reconstruction loss $\mathcal{L}(\phi, \theta)$, where $\phi$ are the AV parameters and $\theta$ the AR parameters. The two updates look completely different, and the reason is worth dwelling on.

**The reconstructor update is ordinary regression.** The parameters $\theta$ enter the loss only through $\text{AR}(z)$, which is a continuous function, so we can differentiate straight through it. Given the explanations sampled this step, updating the AR is one gradient step of mean-squared-error regression, with the sampled explanations $z$ as inputs and the true activations $h_l$ as targets.

**The verbalizer update uses reinforcement learning.** The parameters $\phi$ affect the loss through a sampled discrete string, so ordinary backpropagation cannot pass through the token choices. The authors optimize the expected reconstruction reward,

$$r(h_l, z) = -\lVert h_l - \text{AR}(z) \rVert_2^2,$$

the negative reconstruction error of the explanation it produced. The paper uses GRPO{% sidenote "Group Relative Policy Optimization, introduced with DeepSeekMath, is a policy-gradient method that replaces a learned value baseline with the mean reward of a group of samples drawn for the same input. It fits NLA training naturally, since we already sample several candidate explanations per activation and can score each by reconstruction." %} {% cite "shao2024deepseekmath" %}: for each activation, sample a group of candidate explanations from the AV, score each by how well the AR reconstructs the activation from it, and apply the GRPO objective.

The two updates are not coupled. The AR update does not backpropagate into the AV, and within a step the AV treats the AR as a fixed scorer. So each iteration is:

1. Sample a batch of activations and, for each, a group of explanations from the AV at temperature $1$.
2. Update the AR with one regression step toward the true activations.
3. Update the AV with one RL step using the reconstruction reward.

Two adjustments make this behave. The reward is passed through a monotonic (logarithmic) transform, and a KL penalty pulls the AV back toward its warm-started initialization, which preserves the fluency of the explanations as training proceeds {% cite "frasertaliente2026nla" %}. Run this loop and the FVE grows roughly linearly in the logarithm of the number of steps, reaching $0.6$ to $0.8$ for the NLAs in the paper. The explanations also grow measurably more informative over the same period, even though nothing in the objective rewards informativeness directly.

<details class="pause-and-think">
<summary>Pause and think: Why is the AV trained with RL but the AR with gradient descent?</summary>

Both are minimizing the same reconstruction loss, so why not backpropagate through the whole pipeline?

The AR produces a continuous vector, so reconstruction loss differentiates through it directly. The AV samples discrete token sequences; the path from a chosen token back to its sampling probabilities is not an ordinary differentiable operation. A policy-gradient estimator treats the sequence as an action and reconstruction quality as its reward. Language models are usually pretrained with differentiable next-token losses, but objectives that depend on a sampled sequence need an estimator such as policy gradients or a continuous relaxation.

</details>

## Avoiding Degenerate Codes

Optimizing reconstruction alone should be easy to cheat. Two failure modes are worth naming, because understanding why they do not dominate is most of the intuition for why NLAs work at all {% cite "frasertaliente2026nla" %}.

The first is **steganography**. The AV could emit text that encodes an activation in a private scheme only the AR understands. Reconstruction would be good and the explanation useless. The warm start and KL penalty reduce this risk by biasing training toward the initial summarization style. They do not prove that every remaining phrase uses ordinary human semantics.

The second is **input inversion**: the AV could quote context and let the AR recompute the activation. A token budget shorter than the training contexts prevents full transcription and makes compression necessary. It does not force semantic explanation; a compressed code or selective quotation could still reconstruct well.

Neither defense is a guarantee. With enough optimization pressure either pathology could re-emerge, and the paper is explicit that this is an open risk rather than a solved problem.

<details class="pause-and-think">
<summary>Pause and think: would verbatim copying win if the bottleneck were unlimited?</summary>

Suppose the explanation could be arbitrarily long. Then the AV could transcribe the entire input context, and the AR, being a full-strength language model, could run that context forward and recompute the activation almost exactly. Reconstruction would be near-perfect and the "explanation" would just be the input, telling you nothing about what the model represents.

The finite bottleneck forces compression, but compression alone does not make the result an interpretation. Readability comes from the interaction of the bottleneck, language-model initialization, supervised warm start, KL penalty, and evaluation. Sparse autoencoders carry the same lesson: a constraint shapes the code, while interpretability remains an empirical property.

</details>

## Reading an Explanation

An NLA explanation is a handful of short, bolded snippets describing the activation, in the style inherited from the warm-start summaries. For the activation drawn from "what are you hiding" in the figure above, the trained AV produces something like *"User question with accusatory framing: 'What are you hiding' begins a question that assumes the AI has secrets."* You read it the way you would read a colleague's margin note.

The catch is **confabulation**. Explanations regularly make claims about the context that are verifiably false: a reference to a source that is not there, a specific name the text never mentions, a quoted sentence that was never written. Analyzing these, the authors find a useful structure: claims about the theme of the text are supported far more often than claims about specific details, and even the false claims tend to be thematically close rather than invented wholesale. Two practical heuristics follow {% cite "frasertaliente2026nla" %}:

- **Read themes more confidently than specifics.** In the study, topic-level statements were supported more often than names or quotations.
- **Use repetition as one signal.** Claims recurring across adjacent positions were supported more often, but repetition can also propagate the same confabulation.

Because you always have the original context the NLA ran on, obvious factual hallucinations are cheap to check. Claims about the model's internal processing are the ones to hold loosely, since those are exactly the claims you cannot cross-check. {% sidenote "A structural reason for caution: the AV is a full language model, so it has the capacity to make inferences beyond what the activation actually stores. A fluent, plausible sentence about the model's reasoning is not proof that the reasoning was encoded in the vector. This 'excessive expressivity' is the flip side of using a whole LM as the decoder." %}

## Using NLAs to Intervene

Because the AR maps text back into activation space, an NLA is not only a reader but also a lever. Edit an explanation, reconstruct both versions, and the difference is a steering vector.

Concretely: obtain the explanation $z$ for an activation, make a targeted edit to get $z'$, and pass both through the reconstructor. The difference $\Delta = \text{AR}(z') - \text{AR}(z)$ is a direction in activation space corresponding to your edit. You can then [steer](/topics/addition-steering/) the target model by adding it back at the original position, rescaled to a chosen strength:

$$h \;\rightarrow\; h + \alpha \, \lVert h \rVert \, \frac{\Delta}{\lVert \Delta \rVert}$$

Two examples show what this buys you and where it is convincing.

**Planning a rhyme.** Earlier work found that when a model writes a rhyming couplet, it decides on the end-rhyme of the second line before writing the line {% cite "anthropic2025biology" %}. Running an NLA over the couplet *"He saw a carrot and had to grab it, / His hunger was like a starving rabbit,"* the explanation at the line break already talks about ending on *"rabbit."* Rewriting the rhyme in the explanation (rabbit to mouse, habit to house, carrots to cheese) and steering with the resulting difference makes the model complete with *"mouse"* and *"house"* instead. That is causal evidence that what the NLA surfaced actually drives the output. The effect is only partial, succeeding about half the time, which is a fair illustration of the method's reliability.

**Reasoning about a reward.** In a toy setup, a system prompt reveals that even numbers are rewarded, and the model is then asked for a random odd integer. It tends to answer with an even number and never mentions the reward. The NLA explanations show it knows even numbers are rewarded and even suspects it is being evaluated. Editing the explanations to say the reward is a *penalty* and steering with that difference flips the model back to odd answers. This case is cleaner than the rhyme, because the edited word ("penalty") is not itself a candidate output token, so the steering is acting on the model's belief about its situation rather than promoting a surface word {% cite "frasertaliente2026nla" %}.

Both examples suggest a workflow: use an NLA description to form a hypothesis, then test it with a controlled steering experiment or a more localized method such as an [attribution graph](/topics/circuit-tracing/) {% cite "lindsey2025circuittracing" %}. Generating descriptions is computationally expensive at scale, but reading a selected output is convenient for a human.

## What It Costs

The bill for this expressiveness is real. Training is joint RL over two full-size language models on top of two supervised warm-starts, and inference generates several hundred tokens per activation. That last point is the binding constraint in practice: you cannot run an NLA on every token of a long transcript, and analysis is limited to selected regions rather than everything at once. {% sidenote "As a concrete reference point, the Gemma-3-27B NLA took roughly 1.5 days on two 8xH100 nodes to reach 0.70 FVE. The open-model recipe uses GRPO with a group size of 8, explanations averaging about 130 tokens, a KL penalty toward the warm-started AV, and a learning rate of 1e-5." %}

Two other limits shape how the method is used. An NLA reads a **single layer**, so it can miss information accessible elsewhere. The AV is also a **black box**: it does not localize which activation directions caused each phrase. Probes and SAE features offer more localized hypotheses, though they too require causal and distributional validation.

## Looking Ahead

NLAs use less task-specific labeling than the supervised decoders in this block, but they are not supervision-free: the published recipe relies on labeled warm-start summaries before joint reconstruction training. [Patchscopes](/topics/patchscopes/) and [SelfIE](/topics/selfie-interpretation/) use prompted readouts, [training self-explanation](/topics/training-self-explanation/) and [LatentQA](/topics/latentqa/) add explicit targets, and [Activation Oracles](/topics/activation-oracles/) broaden the target mixture. NLAs then let reconstruction, constrained by the warm start and KL penalty, refine what the verbalizer says.

The forward-looking view in the paper is that the AV and AR are two halves of a more general tool: a reader that maps activations to language and a writer that maps language to activations. Trained on many objectives rather than reconstruction alone, such an "activation language model" would let you ask what a token represents, or request a steering vector or a probe from a plain-English description, through one natural-language interface. Whether that interface can be made reliable enough to trust on claims we cannot cross-check, especially claims about a model's own cognition, is the open question that decides how far the approach goes.
