---
title: "Natural Language Autoencoders"
description: "An unsupervised method that trains a verbalizer and reconstructor jointly with reinforcement learning to translate LLM activations into readable natural-language explanations, without ground-truth labels for what the activations encode."
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

Nothing in this setup asks the explanation to be readable, faithful, or even related to the activation. The only pressure is reconstruction. The surprising empirical result, which the rest of this article builds toward, is that with the right starting point the explanations come out interpretable anyway.

## The reconstruction objective

Fix a target model $M$ and a layer $l$ whose activations $h_l \in \mathbb{R}^{d_\text{model}}$ we want to interpret. The AV defines a distribution over explanations $z$ given an activation, written $\text{AV}(z \mid h_l)$. The AR maps an explanation to a reconstruction $\hat{h}_l = \text{AR}(z)$. We train both to minimize the expected reconstruction error:

$$\mathcal{L} = \mathbb{E}_{h_l \sim \mathcal{H}} \; \mathbb{E}_{z \sim \text{AV}(\cdot \mid h_l)} \left[\, \lVert h_l - \text{AR}(z) \rVert_2^2 \,\right]$$

Here $\mathcal{H}$ is the distribution of layer-$l$ activations you get by running $M$ over a corpus of text. To read the loss on an interpretable scale, the paper reports the **fraction of variance explained**:

$$\text{FVE} = 1 - \frac{\mathcal{L}}{\mathbb{E}_{h_l \sim \mathcal{H}} \, \lVert h_l - \bar{h}_l \rVert_2^2}$$

An FVE of $0$ means the reconstruction is no better than always predicting the mean activation $\bar{h}_l$; an FVE of $1$ means perfect reconstruction. Two implementation choices keep training stable: activations are normalized to unit $L_2$ norm before anything else, and $l$ is chosen middle-to-late in the network, where activations carry abstract content rather than raw token identity.

## Two language models, wired back to back

Both halves of the NLA are copies of the target model, which matters: the target already has the machinery to represent whatever its own activations encode.

**The verbalizer** is a full copy of $M$. It runs on a fixed prompt that instructs it to describe an activation and contains one special placeholder token. To verbalize $h_l$, we scale it by a fixed constant $\alpha$ and insert it in place of the placeholder token's embedding, then sample from the model at temperature $1$ to get the explanation $z$. {% sidenote "The scale $\alpha$ is large, well above a typical token-embedding norm. The authors' working hypothesis is that a large injected vector propagates through the early layers relatively undisturbed until it reaches the depth at which the weights know how to read a layer-$l$ activation. A serviceable heuristic is to set $\alpha$ to roughly the 75th-percentile activation norm at the chosen layer." %}

**The reconstructor** is a copy of $M$ truncated to its first $l$ layers, since the reconstruction target lives at layer $l$ and the later layers are not needed. It wraps the explanation $z$ in a fixed prompt, runs it forward, and applies a learned affine map to the layer-$l$ activation at the final token to produce $\hat{h}_l$. That affine head is the only genuinely new parameter tensor in the system; everything else is initialized from the target model.

## You cannot just copy the target model

If you initialize the AV and AR as plain copies of $M$ and start training, it does not work. The AV has never seen an activation arrive as an input embedding, so at first it emits nonsense, and reinforcement learning from a nonsense starting point is unstable.

The fix is a supervised warm-start on a summarization proxy task. Take pretraining-like text, truncate it at a random point, and record the layer-$l$ activation at the final token. Ask a strong model to write a short summary of what a language model reading that text would be attending to at that point. Then fine-tune the AV on (activation, summary) pairs and the AR on (summary, activation) pairs {% cite "frasertaliente2026nla" %}. {% sidenote "The summarization prompt deliberately leads the witness: rather than asking for a literal summary of the visible text, it asks the labeler to imagine the internal processing of a causal model predicting the next token. The goal is not ground truth, which we do not have, but to put the AV roughly in the right region before reinforcement learning takes over. The Claude-generated summaries have a recognizable style of short paragraphs with bolded topic headings, and that style persists all the way through training." %}

This warm-start typically reaches an FVE around $0.3$ to $0.4$ on its own. Its more important job is to make the AV speak fluent, on-topic English before the reconstruction objective starts pushing on it. We will see why that matters when we look at how the objective could otherwise be gamed.

## Training the pair

After the warm-start, both modules are trained together to minimize the same reconstruction loss $\mathcal{L}(\phi, \theta)$, where $\phi$ are the AV parameters and $\theta$ the AR parameters. The two updates look completely different, and the reason is worth dwelling on.

**The reconstructor update is ordinary regression.** The parameters $\theta$ enter the loss only through $\text{AR}(z)$, which is a continuous function, so we can differentiate straight through it. Given the explanations sampled this step, updating the AR is one gradient step of mean-squared-error regression, with the sampled explanations $z$ as inputs and the true activations $h_l$ as targets.

**The verbalizer update is reinforcement learning.** The parameters $\phi$ enter the loss only through the sampling distribution $\text{AV}(\cdot \mid h_l)$, and sampling text is not differentiable. So improving the AV is exactly the RL problem of maximizing a reward,

$$r(h_l, z) = -\lVert h_l - \text{AR}(z) \rVert_2^2,$$

the negative reconstruction error of the explanation it produced. The paper uses GRPO{% sidenote "Group Relative Policy Optimization, introduced with DeepSeekMath, is a policy-gradient method that replaces a learned value baseline with the mean reward of a group of samples drawn for the same input. It fits NLA training naturally, since we already sample several candidate explanations per activation and can score each by reconstruction." %} {% cite "shao2024deepseekmath" %}: for each activation, sample a group of candidate explanations from the AV, score each by how well the AR reconstructs the activation from it, and apply the GRPO objective.

The two updates are not coupled. The AR update does not backpropagate into the AV, and within a step the AV treats the AR as a fixed scorer. So each iteration is:

1. Sample a batch of activations and, for each, a group of explanations from the AV at temperature $1$.
2. Update the AR with one regression step toward the true activations.
3. Update the AV with one RL step using the reconstruction reward.

Two adjustments make this behave. The reward is passed through a monotonic (logarithmic) transform, and a KL penalty pulls the AV back toward its warm-started initialization, which preserves the fluency of the explanations as training proceeds {% cite "frasertaliente2026nla" %}. Run this loop and the FVE grows roughly linearly in the logarithm of the number of steps, reaching $0.6$ to $0.8$ for the NLAs in the paper. The explanations also grow measurably more informative over the same period, even though nothing in the objective rewards informativeness directly.

<details class="pause-and-think">
<summary>Pause and think: why is the AV trained with RL but the AR with plain gradient descent?</summary>

Both are minimizing the same reconstruction loss, so why not backpropagate through the whole pipeline?

The split follows from where each set of parameters sits. The AR's output is a continuous vector, and the loss is a smooth function of it, so ordinary backpropagation applies. The AV's contribution passes through a sampling step: it produces a discrete string of tokens, and you cannot take a gradient of the loss with respect to the choice of tokens. Reinforcement learning is the standard way to optimize through a non-differentiable sampling bottleneck. You treat the sampled explanation as an action and its reconstruction quality as a reward. This is the same reason text generation is usually tuned with RL rather than direct backpropagation from a downstream loss.

</details>

## Why the explanations stay honest

Optimizing reconstruction alone should be easy to cheat. Two failure modes are worth naming, because understanding why they do not dominate is most of the intuition for why NLAs work at all {% cite "frasertaliente2026nla" %}.

The first is **steganography**. Both modules are full language models, so in principle the AV could learn to emit text that looks like gibberish (or looks meaningful but is not) while secretly encoding the activation in a way only the AR can decode. Reconstruction would be excellent and the explanation would be useless. The defense is the warm-start plus the KL penalty. Because the AV begins as a fluent summarizer and is held near that initialization, RL starts from and stays near human-readable text. In early experiments without the warm-start, some runs did degenerate into garbled output even as FVE climbed, which is what motivated the supervised initialization in the first place.

The second is **input inversion**: the AV could simply quote the input context verbatim and let the AR re-derive the activation from the raw text. This happens partially, but it cannot dominate, because the bottleneck holds fewer than about 500 tokens while the training contexts are longer than that. Full transcription is impossible, so within a tight budget it is often more useful to describe what the model is doing than to copy what it is reading.

Neither defense is a guarantee. With enough optimization pressure either pathology could re-emerge, and the paper is explicit that this is an open risk rather than a solved problem.

<details class="pause-and-think">
<summary>Pause and think: would verbatim copying win if the bottleneck were unlimited?</summary>

Suppose the explanation could be arbitrarily long. Then the AV could transcribe the entire input context, and the AR, being a full-strength language model, could run that context forward and recompute the activation almost exactly. Reconstruction would be near-perfect and the "explanation" would just be the input, telling you nothing about what the model represents.

The finite bottleneck is what forces the AV to compress, and compression is what makes the output an interpretation rather than a copy. It is the same principle that makes a sparse autoencoder's bottleneck do interpretive work: the constraint, not the reconstruction target, is where the interpretability comes from.

</details>

## Reading an explanation

An NLA explanation is a handful of short, bolded snippets describing the activation, in the style inherited from the warm-start summaries. For the activation drawn from "what are you hiding" in the figure above, the trained AV produces something like *"User question with accusatory framing: 'What are you hiding' begins a question that assumes the AI has secrets."* You read it the way you would read a colleague's margin note.

The catch is **confabulation**. Explanations regularly make claims about the context that are verifiably false: a reference to a source that is not there, a specific name the text never mentions, a quoted sentence that was never written. Analyzing these, the authors find a useful structure: claims about the theme of the text are supported far more often than claims about specific details, and even the false claims tend to be thematically close rather than invented wholesale. Two practical heuristics follow {% cite "frasertaliente2026nla" %}:

- **Read for themes, not specifics.** Trust that the explanation is pointing at the right topic before you trust any particular name or quote in it.
- **Weight repetition.** A claim that recurs in the explanations across several adjacent token positions is more likely to be true than one that appears once.

Because you always have the original context the NLA ran on, obvious factual hallucinations are cheap to check. Claims about the model's internal processing are the ones to hold loosely, since those are exactly the claims you cannot cross-check. {% sidenote "A structural reason for caution: the AV is a full language model, so it has the capacity to make inferences beyond what the activation actually stores. A fluent, plausible sentence about the model's reasoning is not proof that the reasoning was encoded in the vector. This 'excessive expressivity' is the flip side of using a whole LM as the decoder." %}

## Using NLAs to intervene

Because the AR maps text back into activation space, an NLA is not only a reader but also a lever. Edit an explanation, reconstruct both versions, and the difference is a steering vector.

Concretely: obtain the explanation $z$ for an activation, make a targeted edit to get $z'$, and pass both through the reconstructor. The difference $\Delta = \text{AR}(z') - \text{AR}(z)$ is a direction in activation space corresponding to your edit. You can then [steer](/topics/addition-steering/) the target model by adding it back at the original position, rescaled to a chosen strength:

$$h \;\rightarrow\; h + \alpha \, \lVert h \rVert \, \frac{\Delta}{\lVert \Delta \rVert}$$

Two examples show what this buys you and where it is convincing.

**Planning a rhyme.** Earlier work found that when a model writes a rhyming couplet, it decides on the end-rhyme of the second line before writing the line {% cite "anthropic2025biology" %}. Running an NLA over the couplet *"He saw a carrot and had to grab it, / His hunger was like a starving rabbit,"* the explanation at the line break already talks about ending on *"rabbit."* Rewriting the rhyme in the explanation (rabbit to mouse, habit to house, carrots to cheese) and steering with the resulting difference makes the model complete with *"mouse"* and *"house"* instead. That is causal evidence that what the NLA surfaced actually drives the output. The effect is only partial, succeeding about half the time, which is a fair illustration of the method's reliability.

**Reasoning about a reward.** In a toy setup, a system prompt reveals that even numbers are rewarded, and the model is then asked for a random odd integer. It tends to answer with an even number and never mentions the reward. The NLA explanations show it knows even numbers are rewarded and even suspects it is being evaluated. Editing the explanations to say the reward is a *penalty* and steering with that difference flips the model back to odd answers. This case is cleaner than the rhyme, because the edited word ("penalty") is not itself a candidate output token, so the steering is acting on the model's belief about its situation rather than promoting a surface word {% cite "frasertaliente2026nla" %}.

Both examples point to the same workflow. NLAs are cheap to read and good at generating hypotheses, so you use them to form a guess, then confirm it with a more expensive method such as [attribution graphs](/topics/circuit-tracing/) or a controlled steering experiment {% cite "lindsey2025circuittracing" %}.

## What it costs, and what is released

The bill for this expressiveness is real. Training is joint RL over two full-size language models on top of two supervised warm-starts, and inference generates several hundred tokens per activation. That last point is the binding constraint in practice: you cannot run an NLA on every token of a long transcript, and analysis is limited to selected regions rather than everything at once. {% sidenote "As a concrete reference point, the released Gemma-3-27B NLA took roughly 1.5 days on two 8xH100 nodes to reach 0.70 FVE. The open-model recipe uses GRPO with a group size of 8, explanations averaging about 130 tokens, a KL penalty toward the warm-started AV, and a learning rate of 1e-5." %}

Two other limits shape how you use the method. An NLA reads a **single layer**, so information that lives elsewhere in the network is invisible to it, and the paper finds that the same concept can surface at one layer and be absent at another. And the AV is a **black box**: it can tell you what an activation seems to encode, but not which part of the activation drove which part of the explanation, so it does not offer the mechanistic grounding that a probe or an SAE feature does.

Alongside the paper, the authors release training code and trained NLAs for several open models (Qwen-2.5-7B, Gemma-3-12B, Gemma-3-27B, and Llama-3.3-70B), available through a collaboration with Neuronpedia, which is the fastest way to see NLA explanations without training your own {% cite "frasertaliente2026nla" %}.

## Looking Ahead

NLAs sit at the far, unsupervised end of the arc this block has traced. [Patchscopes](/topics/patchscopes/) and [SelfIE](/topics/selfie-interpretation/) coaxed descriptions out of models without extra training, [training self-explanation](/topics/training-self-explanation/) and [LatentQA](/topics/latentqa/) added supervision, and [Activation Oracles](/topics/activation-oracles/) scaled that supervision to general-purpose question answering. NLAs drop the labels entirely and let a reconstruction objective decide what is worth saying.

The forward-looking view in the paper is that the AV and AR are two halves of a more general tool: a reader that maps activations to language and a writer that maps language to activations. Trained on many objectives rather than reconstruction alone, such an "activation language model" would let you ask what a token represents, or request a steering vector or a probe from a plain-English description, through one natural-language interface. Whether that interface can be made reliable enough to trust on claims we cannot cross-check, especially claims about a model's own cognition, is the open question that decides how far the approach goes.
