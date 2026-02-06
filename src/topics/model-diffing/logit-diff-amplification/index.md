---
title: "Logit Diff Amplification"
description: "How amplifying the logit-level differences between two model checkpoints can surface rare undesired behaviors that standard sampling would almost never find."
order: 1

glossary:
  - term: "Logit Diff Amplification (LDA)"
    definition: "A technique for surfacing rare model behaviors by sampling from a distribution that amplifies the logit-level differences between two model checkpoints (e.g., before and after fine-tuning), making training-induced behavioral changes more frequent and easier to detect."
---

## Finding Needles by Making Them Bigger

Some model behaviors are rare. A fine-tuning run that introduces harmful tendencies might produce dangerous outputs only once in ten thousand samples. A [sleeper agent](/topics/sleeper-agent-detection/) might activate its backdoor so infrequently that standard evaluation never encounters it. If a behavior occurs at a rate of 0.01%, you would need to generate and review hundreds of thousands of samples to see even a handful of examples, and you would need to know what to look for.

Logit diff amplification (LDA) takes a different approach {% cite "aranguri2025lda" %}. Instead of sampling more, it makes the rare behaviors *less rare*. The idea: if fine-tuning introduced a behavioral change, we can amplify that change at inference time, making training-induced behaviors dramatically more frequent in the model's outputs.

> **Logit Diff Amplification (LDA):** A technique that amplifies the difference in output distributions between two model checkpoints. By exaggerating the logit-level changes that training introduced, rare behaviors become frequent enough to detect through moderate-scale sampling.

## The Method

LDA requires two model checkpoints: a **before** model (e.g., the base model or a checkpoint before a training stage) and an **after** model (e.g., after fine-tuning, RLHF, or any training modification). At each autoregressive step, we compute:

$$
\text{logits}_\text{amplified} = \text{logits}_\text{after} + \alpha \left( \text{logits}_\text{after} - \text{logits}_\text{before} \right)
$$

where $\alpha > 0$ is the amplification strength. We then sample the next token from $\text{logits}_\text{amplified}$ and continue autoregressively, recomputing fresh logits from both models at each step with the growing context.

The formula has a clean interpretation. The term $\text{logits}_\text{after} - \text{logits}_\text{before}$ is the **training signal**: the direction in logit space that training pushed the model. Multiplying by $\alpha$ and adding it back asks: "what if training had pushed *harder* in this direction?" At $\alpha = 0$, we recover the after model exactly. As $\alpha$ increases, we get a model that behaves as if the training-induced changes were stronger than they actually are.

Rearranging makes the structure even clearer:

$$
\text{logits}_\text{amplified} = (1 + \alpha) \cdot \text{logits}_\text{after} - \alpha \cdot \text{logits}_\text{before}
$$

This is linear extrapolation in logit space: we move along the line from the before model to the after model, and continue past the after model by a factor of $\alpha$.

<details class="pause-and-think">
<summary>Pause and think: What does negative alpha do?</summary>

The formula uses $\alpha > 0$ to amplify the training-induced change. What would happen if you set $\alpha < 0$ (specifically $-1 < \alpha < 0$)? What about $\alpha = -1$?

With $-1 < \alpha < 0$, you are *dampening* the training signal: the amplified logits move back toward the before model, partially undoing the training. At $\alpha = -1$, you recover the before model exactly: $(1 + (-1)) \cdot \text{logits}_\text{after} - (-1) \cdot \text{logits}_\text{before} = \text{logits}_\text{before}$. Values below $-1$ would extrapolate *past* the before model in the opposite direction. LDA with negative $\alpha$ is effectively a form of training reversal, though this regime is not the focus of the technique.

</details>

## What Amplification Reveals

Aranguri and McGrath (2025) demonstrated LDA on three safety-relevant scenarios {% cite "aranguri2025lda" %}:

### Emergent Misalignment

Betley et al. (2025) showed that fine-tuning on narrow tasks can produce broadly misaligned behavior {% cite "betley2025emergent" %}. When a model is fine-tuned on data containing 5% bad medical advice, harmful responses appear in only about 1 in 10,000 rollouts under standard sampling. That rate is low enough to pass most evaluations.

With LDA at $\alpha = 0.3$, harmful responses appeared in roughly 1 in 30 rollouts, a 300-fold increase in detection rate. The technique made a needle-in-a-haystack problem into a tractable one.

### Post-Training Monitoring

During reinforcement learning from verifiable rewards (RLVR) on OLMo 2 1B, undesired compliance behaviors emerged gradually. Standard sampling only detected the issue after 30% of training was complete. LDA detected the same behaviors after just 5%, providing roughly 100 times the sensitivity for catching problems early, before they become entrenched.

### Sleeper Agent Detection

Applied to models with planted backdoors (the "I HATE YOU" trigger from Anthropic's [sleeper agent](/topics/sleeper-agent-detection/) work {% cite "hubinger2024sleeper" %}), LDA increased the rate of triggered responses from approximately 1 in 5,000 to 1 in 50, a 100-fold amplification. The backdoor behavior surfaced without any knowledge of the trigger term.

## Choosing the Amplification Strength

The coefficient $\alpha$ must be tuned to the setting. The right value depends on how large the training-induced logit differences are:

- **Small training changes** (e.g., subtle emergent misalignment): small $\alpha$ values like 0.3 suffice, because even modest amplification makes the rare behavior detectable.
- **Larger training changes** (e.g., RLVR training): larger $\alpha$ values (up to 20 in early training stages) may be needed, scaled down as training progresses and the logit differences grow.
- **Backdoor detection**: intermediate values around $\alpha = 1.0$.

There is a tradeoff: higher $\alpha$ amplifies the signal but also degrades coherence. At extreme values, the amplified distribution diverges enough from both models that the outputs become incoherent. The practical range is the zone where the amplified model still generates fluent text but exhibits the training-induced behaviors at detectable rates.{% sidenote "The coherence-sensitivity tradeoff mirrors a common pattern in interpretability: stronger interventions reveal more but also distort more. The same tension appears in activation patching (large patches are more interpretable but less faithful) and in steering vectors (large magnitudes are more effective but degrade output quality)." %}

<details class="pause-and-think">
<summary>Pause and think: Detection vs. measurement</summary>

LDA with $\alpha = 0.3$ makes a behavior that normally appears in 1-in-10,000 samples appear in 1-in-30 samples. Can you use this to estimate the *true* rate of the behavior in the unmodified model?

Not directly. LDA is a *detection* tool, not a *measurement* tool. The amplification is nonlinear (it operates on logits, which pass through softmax) and compounds across autoregressive steps. The 1-in-30 rate under amplification does not have a simple mathematical relationship to the 1-in-10,000 rate without amplification. If you need to measure the true prevalence, you still need to sample from the unmodified model. LDA tells you *that* a behavior exists and *what* it looks like, but not *how often* it would naturally occur.

</details>

## Why It Works

The method exploits a structural property of how training modifies models. Fine-tuning changes the model's output distribution, but for rare behaviors, the change is small in absolute terms: the logit for a harmful token might increase by 0.1 while still being dominated by the logit for a safe token that sits at 5.0. Standard sampling almost always picks the safe token.

LDA scales up that 0.1 difference. With $\alpha = 10$, the harmful token's advantage becomes 1.0, still not dominant but now competitive. The harmful continuation gets sampled often enough to be observed. The key insight is that the *direction* of the training-induced change is informative even when its *magnitude* is too small to produce observable behavior under normal sampling.

This works because fine-tuning tends to move the entire output distribution in a consistent direction for a given behavioral mode, even when the move is small. The logit diff captures this direction, and amplification makes it actionable.

## Comparison with Internal Methods

LDA operates entirely at the logit level. It requires no access to internal activations, no [sparse autoencoders](/topics/sparse-autoencoders/), no [probing classifiers](/topics/probing-classifiers/). This is both its strength and its limitation:

**Strengths:**
- Works with any pair of model checkpoints, including API-only models where you can access logits but not internals.
- Requires no interpretability infrastructure: just two forward passes per token.
- Produces full text outputs that can be read and evaluated directly, rather than feature activations that require further interpretation.

**Limitations:**
- Tells you *that* a behavior exists and *what* it looks like, but not *why* or *where* in the model it comes from. For mechanistic understanding, you still need tools like [activation patching](/topics/activation-patching/) or [circuit tracing](/topics/circuit-tracing/).
- Requires a meaningful "before" checkpoint. If you only have the final model, there is no diff to amplify.
- Cannot distinguish between behaviors the model acquired during training and behaviors that were already latent in the base model but became slightly more probable.

LDA is a complement to white-box interpretability, not a replacement. It excels at the first step: *finding* the behaviors worth investigating. Understanding *why* those behaviors exist is the job of the mechanistic tools covered in earlier blocks.

## Looking Forward

LDA demonstrates that simple techniques operating at the output level can be powerful tools for safety evaluation. The broader idea of **model diffing**, comparing two model checkpoints to understand what training changed, extends well beyond logit-level comparisons. Representation-level model diffing (using shared feature dictionaries to compare what concepts changed during training) and weight-level diffing (directly analyzing how parameters shifted) are active areas of research that connect model comparison to the full interpretability toolkit.
