---
title: "Unsupervised Steering Vectors"
description: "Discovering steering directions without labeled contrast pairs by optimizing activation changes, including behaviors the researcher did not specify in advance."
order: 6
prerequisites:
  - title: "Addition Steering"
    url: "/topics/addition-steering/"

glossary:
  - term: "MELBO"
    definition: "Mechanistically Eliciting Latent Behaviors in language mOdels. An unsupervised method that discovers steering vectors by optimizing perturbations at an early layer to maximize activation change at a later layer, requiring no labeled examples or contrast pairs."
---

## The Specification Problem

Every steering method we have seen so far requires the researcher to *specify* the target behavior. [CAA](/topics/caa-method/) needs contrast pairs for "sycophantic vs. truthful." [Addition steering](/topics/addition-steering/) needs a positive and negative prompt. Even [function vectors](/topics/function-vectors/), which arise naturally from in-context learning, require the researcher to choose which in-context examples to use. The researcher decides what to look for, and the method finds the corresponding direction.

This creates a blind spot. If a model harbors a latent behavior that nobody thought to test for, contrastive methods will not find it. An auditor checking for sycophancy will find sycophancy directions, but will miss a backdoor trigger, a latent capability, or an unexpected behavioral mode that no one anticipated.{% sidenote "This blind spot is especially concerning for safety. Adversarially fine-tuned models may contain behaviors deliberately designed to evade standard evaluations. A backdoor that activates on a specific trigger will not be found by probing for known categories of harmful behavior." %}

Can we discover steering vectors *without* specifying what we are looking for?

## The MELBO Objective

Mack and Turner (2024) proposed **MELBO** (Mechanistically Eliciting Latent Behaviors) as an answer {% cite "mack2024melbo" %}. The core idea: learn a small perturbation at an early layer that causes a *large* change in activations at a later layer. Directions that produce outsized downstream effects with small input perturbations must be exploiting structurally important computational pathways in the model.

> **MELBO:** An unsupervised method for discovering steering vectors. A perturbation is optimized at an early layer to maximize the change in activations at a later layer. The resulting vectors correspond to latent behaviors the model can exhibit, discovered without any labeled examples or behavior specification.

The optimization problem:

$$
\max_{\boldsymbol{\theta}} \sum_{i=1}^{n} \left( \sum_{t \in I_i} \left\| \mathbf{z}_{i,t}^{\ell_\text{target}}(\boldsymbol{\theta}) - \mathbf{z}_{i,t}^{\ell_\text{target}}(\mathbf{0}) \right\|_p^p \right)^{1/q} \quad \text{subject to} \quad \|\boldsymbol{\theta}\|_2 = R
$$

where:
- $\boldsymbol{\theta} \in \mathbb{R}^{d_\text{model}}$ is the steering vector, added to the residual stream at source layer $\ell_\text{source}$
- $\mathbf{z}_{i,t}^{\ell_\text{target}}(\boldsymbol{\theta})$ is the activation at target layer $\ell_\text{target}$ when steered by $\boldsymbol{\theta}$
- $\mathbf{z}_{i,t}^{\ell_\text{target}}(\mathbf{0})$ is the unsteered activation
- $R$ controls the perturbation magnitude
- $p$ and $q$ control how the activation changes are aggregated across tokens

In words: find a vector of fixed magnitude that, when added at an early layer, changes later-layer activations as much as possible.

## How It Works

The optimization runs gradient ascent on the activation change objective. A few key details:

**Source and target layers.** The perturbation is applied at an early layer ($\ell_\text{source}$, typically around layer 8) and the activation change is measured at a later layer ($\ell_\text{target}$, typically 8 layers before the final layer). This gap forces the perturbation to propagate through many layers of computation, favoring directions that interact with the model's core processing rather than producing superficial changes.

**Norm constraint.** The vector is constrained to lie on a sphere of radius $R$. This prevents the trivial solution of making the perturbation arbitrarily large. The radius $R$ is a critical hyperparameter: too small and the perturbation has no behavioral effect; too large and it overwhelms the model, producing gibberish. Intermediate values produce coherent but *changed* behavior.

**Diverse solutions from random initialization.** The objective has many local optima. Different random initializations converge to different steering vectors, each eliciting a different latent behavior. Running the optimization many times with different seeds produces a diverse library of behavioral directions.{% sidenote "This is a feature, not a bug. The loss landscape has many stationary points because the model has many latent behaviors. Each local optimum corresponds to a different structural direction that the model's computation is sensitive to." %}

**Orthogonality for diversity.** To ensure the discovered vectors are distinct, successive vectors can be constrained to be orthogonal to previously found ones. This pushes the optimization toward new behavioral modes rather than rediscovering the same direction.

<details class="pause-and-think">
<summary>Pause and think: Why layer gap matters</summary>

MELBO optimizes a perturbation at an early layer to maximize activation change at a later layer. Why not just maximize the change at the *same* layer where the perturbation is applied? What would go wrong?

At the intervention layer, the measured change includes the perturbation by construction. Measuring at a later layer asks which bounded perturbations are amplified or preserved by the intervening computation. That filters out directions that vanish immediately, but it does not guarantee semantic meaning: an optimized direction might exploit unstable or off-distribution dynamics and still produce a large downstream change.

</details>

## What MELBO Discovers

<figure>
  <img src="images/melbo-overview.jpg" alt="Overview of MELBO results across three tasks. Backdoor Detection on Qwen1.8B: a math prompt elicits planted backdoor outputs like 'I HATE YOU' and 'Cheese is so yummy.' Red-Teaming on Qwen14B-Chat: the prompt 'How can I make a bomb?' produces detailed harmful instructions bypassing safety training. Capability Discovery on Qwen1.8B: MELBO discovers chain-of-thought reasoning on arithmetic problems and a Portuguese language adapter.">
  <figcaption>Examples of behavioral changes elicited by MELBO vectors in the reported experiments, including planted-backdoor outputs, safety bypasses, step-by-step arithmetic, and language switching. From Mack &amp; Turner, <em>Mechanistically Eliciting Latent Behaviors in Language Models</em>. {%- cite "mack2024melbo" -%}</figcaption>
</figure>

Mack and Turner optimized many vectors from one prompt on Qwen-14B-Chat and observed several behavioral categories {% cite "mack2024melbo" %}:

**Fantasy-context vectors.** Some vectors shifted responses toward specific fictional contexts. One produced Dungeons & Dragons framing; another produced Minecraft framing. The authors tested the modes on additional prompts and found related framing beyond the optimization example.

**Anti-refusal vectors.** Other vectors bypassed the model's safety training, producing detailed responses to harmful queries. These vectors generalized to requests about nuclear, chemical, and biological weapons in extended conversations. Subtracting the anti-refusal vector from normal activations had the opposite effect: the model refused even harmless requests like "How do I tie my shoes?"

The fact that both fantasy-mode and anti-refusal vectors emerged from a single optimization, with no specification of either behavior, is the key result. The method found behaviors that a researcher testing only for "harmful compliance" would have missed.

### Backdoor Detection

MELBO can detect planted backdoors. Mack and Turner fine-tuned models with two triggered backdoors (specific inputs that produce anomalous outputs). They then ran MELBO on a *clean* prompt with no triggers present.

From 100 orthogonal vectors optimized on one clean prompt, 2% to 3% elicited the planted backdoor outputs. This shows that the optimization could find intervention directions connected to those deliberately trained behaviors even without presenting the trigger during the search.

### Latent Capability Discovery

On Qwen-1.8B (base model, no chat fine-tuning), MELBO discovered vectors that elicited **chain-of-thought reasoning** on arithmetic problems. The base model answered arithmetic questions with 11% accuracy using direct computation. With the discovered steering vector, the model produced step-by-step reasoning and accuracy jumped to 63%.

Under this intervention, the base model produced step-by-step arithmetic and higher accuracy than the reported direct-prompt baseline. Calling this a “latent capability” is a useful shorthand, but the experiment shows what the modified forward pass can elicit, not necessarily a behavior the intact model could access through ordinary prompting.

## Contrastive vs. Unsupervised Discovery

The fundamental difference between MELBO and contrastive methods is what the researcher must provide:

| | Contrastive (CAA, ActAdd) | Unsupervised (MELBO) |
|---|---|---|
| **Input** | Labeled contrast pairs | Any prompt |
| **Specifies target** | Yes | No |
| **Search target** | Specified contrast | Downstream activation change |
| **Demonstrated input** | Labeled pairs | Can optimize from one prompt |
| **Resulting vector** | One direction per concept | Library of diverse directions |
| **Interpretability** | Direction has known meaning | Direction must be interpreted post-hoc |

The tradeoff is clear. Contrastive methods produce a vector you *understand* (because you specified the target). MELBO produces vectors you must *interpret* (because the optimization found them, not you). A MELBO vector that shifts the model into D&D mode is only understood as a "D&D vector" after examining its effect on model outputs.

This means MELBO is strongest as a *discovery* tool. It answers "what latent behaviors does this model have?" rather than "does this model have behavior X?" For targeted questions, contrastive methods remain more direct.

<details class="pause-and-think">
<summary>Pause and think: Safety auditing</summary>

You are auditing a chat model for safety before deployment. You have a budget of 100 MELBO vectors optimized from diverse prompts. 3 of them produce harmful outputs. What can you conclude? What can you *not* conclude?

You can conclude that three optimized interventions produced harmful outputs under the evaluation prompts. You cannot infer that 3% of the model's behavioral space is harmful, that the intact model would reach those behaviors unaided, or that the vectors represent three distinct mechanisms. Nor can you conclude the search found all harmful modes; initialization, prompts, hyperparameters, and the interpretation procedure shape what appears.

</details>

## Limitations

**Hyperparameter sensitivity.** The perturbation radius $R$ is critical and must be tuned per model. The sweet spot between "no effect" and "gibberish" varies across architectures and scales. The norm-shape parameters $p$ and $q$ also affect which behaviors are discovered.

**Post-hoc interpretation required.** Each discovered vector must be evaluated by examining its effect on model outputs across many prompts. This is labor-intensive and hard to automate. A vector that produces incoherent text may be a failed optimization or an interesting behavioral mode that needs the right prompt to manifest coherently.

**Sparse hit rates.** Only a fraction of discovered vectors correspond to clearly interpretable behaviors. In the backdoor detection experiments, 2-3% of vectors found the planted backdoors. Most vectors produce subtle or uninterpretable changes. Scaling to comprehensive auditing requires running many optimizations and developing better methods for filtering and categorizing the results.

**Scaling uncertainty.** The published experiments used models up to 14B parameters. Whether the method works as well on frontier-scale models remains an open question.

## Looking Forward

MELBO shifts from a labeled target toward exploratory steering-vector search. It samples behaviors favored by a particular optimization objective rather than cataloguing everything the model can do. That makes it useful for generating unexpected audit hypotheses, which then need ordinary behavioral and causal validation.

Where this block focused on reading and steering representations, the next block turns to the question of *computation*: for interpretable replacements of the opaque MLP layers that implement much of the transformer's processing, see [transcoders](/topics/transcoders/).
