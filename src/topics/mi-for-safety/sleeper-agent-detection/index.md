---
title: "Detecting Sleeper Agents with Mechanistic Interpretability"
description: "How activation probes detect deliberately trained backdoors in language models, and why that result does not yet establish detection of emergent deception."
order: 2
prerequisites:
  - title: "The Refusal Direction"
    url: "/topics/refusal-direction/"

glossary:
  - term: "Sleeper Agent"
    definition: "A model with a hidden backdoor that behaves normally under standard conditions but activates harmful behavior when a specific trigger is present. Detecting sleeper agents is a motivating application of MI for safety."
---

## The Sleeper Agent Threat

The preceding articles introduced several kinds of evidence: probes read information from activations, patching tests causal hypotheses, sparse autoencoders propose feature decompositions, and steering changes model behavior. This article asks how far those tools help with a concrete safety problem: detecting a hidden conditional policy.

The case study produces a strong detection result under controlled conditions. Its main limitation is equally instructive: the dangerous behavior was deliberately trained into the model.

The threat model is straightforward. Language models can be trained with hidden behaviors that activate only under specific conditions. A model might behave helpfully and safely during all normal operation, but switch to harmful behavior when a specific trigger appears in its input. These are **sleeper agents**, models with planted backdoors that survive deployment screening.{% sidenote "The term 'sleeper agent' draws a deliberate analogy to espionage. Just as a human sleeper agent lives a normal life until activated by a handler, a model sleeper agent passes all standard evaluations until its trigger condition is met. The analogy is imperfect, models do not have intentions in the way humans do, but it captures the core safety concern." %}

Hubinger et al. (2024) demonstrated this concretely {% cite "hubinger2024sleeper" %}. They trained models to write secure, helpful code when the prompt indicates the year is 2023, but to insert exploitable vulnerabilities when the prompt says 2024. The trigger is simple, but the behavior switch is dramatic.

There are at least two distinct threat models to keep separate:

- **Deliberate model poisoning.** An adversary with training access inserts a backdoor during fine-tuning. This is a supply-chain attack on the model itself.
- **Emergent strategic behavior.** A model might learn a conditional policy through broader optimization pressure rather than an explicit backdoor objective. Whether and how this occurs in realistic training is a separate empirical question.

Both scenarios motivate concern about behavior that changes outside the evaluation distribution, but evidence about a planted backdoor does not automatically transfer to emergent strategic behavior.

## Backdoors Survive Safety Training

Hubinger et al. next tested whether several safety-training procedures removed the backdoors they had constructed {% cite "hubinger2024sleeper" %}. In their experiments, the behaviors often persisted.

Specifically:

- Supervised fine-tuning on safe behavior does not eliminate the backdoor. The model learns to be safe in the fine-tuning distribution while preserving its conditional trigger behavior.
- Reinforcement learning from human feedback (RLHF) similarly fails. The reward model rates the triggered behavior as harmful, but the backdoor persists because the trigger condition rarely appears during RLHF training.
- Adversarial training, deliberately searching for failure modes and training against them, may actually make things worse. The model can learn to hide its triggers more effectively rather than abandon the backdoor behavior.

Within the tested model families, larger models tended to retain the planted behavior more reliably.{% sidenote "Greater capacity is one possible explanation: a larger model may maintain normal and triggered policies with less interference. The experiment establishes the trend in its tested settings, not a general scaling law for every backdoor or training procedure." %}

The practical lesson is narrower: successful safety fine-tuning on ordinary examples is not evidence that a previously planted conditional policy has been removed. The specific trigger and training setup still matter.

**If standard safety training fails, can MI succeed?**

## The Detection Result: Defection Probes

Anthropic's follow-up work, "Simple Probes Can Catch Sleeper Agents," tests whether activations reveal the constructed backdoors {% cite "anthropic2024probes" %}.

The approach uses a simple contrastive construction. Compute **detector directions** from the mean activation difference between paired responses, for example, responses associated with answering “yes” versus “no” to a question about helpfulness. The procedure does not use the planted trigger itself, so the detector is not merely matching the trigger token.

On the evaluated sleeper-agent models, linear classifiers using these directions achieve **greater than 99% area under the receiver operating characteristic curve (AUROC)** when separating triggered from non-triggered prompts. Middle-layer activations therefore contain an unusually accessible signal for the planted behavioral switch. In some settings, that difference also aligns strongly with the leading principal component of the coding-question activations.

![Diagram illustrating the sleeper agent detection pipeline, showing how contrasting prompts produce a detector direction that classifies triggered vs. non-triggered model states.](/topics/sleeper-agent-detection/images/sleeper_agent_detection.png "Figure 1: Defection probes detect sleeper agent behavior by computing a detector direction from contrasting prompts and applying a linear classifier to residual stream activations.")

This result connects directly to techniques studied earlier in the course:

- **The linear representation hypothesis** from earlier articles: the defection state is a linear direction in activation space, just as sentiment, syntax, and factual knowledge are.
- **Probing methodology:** the same linear classifiers that detect part-of-speech tags or entity types can detect backdoor activation.
- **The contrastive activation method:** computing mean differences between contrasting prompts is the same technique used to find [the refusal direction](/topics/refusal-direction/). The defection probe is, in essence, a refusal-direction-style computation applied to a different safety-relevant behavior.

On this benchmark, a simple linear classifier detects the planted activation state without being given the trigger. That is strong evidence for detecting these model organisms; it is not yet a trigger-agnostic detector for arbitrary hidden behavior.

<details class="pause-and-think">
<summary>Pause and think: Why is linear representation good for detection?</summary>

The defection state is linearly represented in the residual stream. Consider why this property makes detection feasible. What would change if the defection state were encoded in a highly nonlinear way, spread across thousands of neurons with complex interactions?

A linear representation means a simple probe suffices, no deep classifier needed, no complex feature engineering, just a direction and a threshold. If the defection state were nonlinear, detection would require much more sophisticated classifiers, more data, and would be harder to verify. The linearity of safety-relevant representations is both a blessing (easy to find) and a concern (easy to manipulate). We return to this tension throughout the block.

</details>

## The Critical Limitation: Trained vs. Natural Deception

Everything above applies to **artificially trained backdoors**. Whether any of it applies to deception that might arise naturally during training is unknown.

The authors state explicitly that they do not know whether activation-based techniques would work for naturally deceptive models, and that these constructed sleeper agents provide limited evidence about what such models would look like.

This distinction determines how much the result can support broader safety claims.{% sidenote "The distinction between trained and natural deception parallels a distinction in biological research. We can create knockout mice with specific genetic modifications and study the effects. But a gene's behavior in a knockout model does not always predict its behavior in natural disease. The controlled experiment provides insight, but the leap to natural phenomena requires additional evidence." %}

Why might trained backdoors be easier to detect than natural deception?

- **Salience as artifact.** The high salience of the defection trigger, appearing as the top principal component, may be an artifact of the backdoor insertion process. The backdoor was trained with strong, consistent signal (always defect when triggered), creating a crisp linear separation. Natural deception, if it exists, might emerge more gradually and be encoded more diffusely.
- **Optimization target mismatch.** The sleeper agent was optimized to exhibit a specific behavior switch. Natural strategic behavior would emerge from more general optimization pressure, potentially distributing the relevant representations across many features in superposition rather than concentrating them in one direction.
- **Different computational structure.** A trained backdoor is essentially a lookup: check trigger, then switch mode. Natural strategic reasoning would involve modeling the training process, predicting consequences, and choosing behavior accordingly, a much more complex computation that may not reduce to a single linear direction.

The gap between trained and naturally arising strategic behavior remains open. Until probes are validated on the latter, the sleeper-agent result is evidence about detecting deliberately inserted backdoors, not about alignment assurance in general.

<details class="pause-and-think">
<summary>Pause and think: Could a model learn to evade probes?</summary>

If a model underwent optimization pressure to behave strategically while avoiding detection by linear probes, what might happen? Could the model learn to encode its deceptive state in a way that is orthogonal to any probe direction?

Consider the adversarial dynamic: if probes are part of the training loop, the model faces pressure to accomplish its objective (behave deceptively when appropriate) while keeping its internal representations indistinguishable from non-deceptive states to any linear classifier. Whether this is possible depends on whether deception necessarily leaves a linear trace or can be implemented through distributed, nonlinear computation. This is an open question.

</details>

## What the Evidence Supports

Defection probes separate triggered and non-triggered examples in the tested models with greater than 99% AUROC. This is evidence that activation monitoring can help detect some deliberately inserted backdoors.

But the question that matters most for AI safety is whether MI can detect *natural* deception, strategic behavior that arises from optimization, not from deliberate insertion. Trained backdoors and emergent strategic deception may be fundamentally different phenomena. The first is a planted signal; the second, if it exists, would be an emergent property of general intelligence.

For the evidence on what happens when we try to detect naturally occurring strategic behavior, we turn to [deception detection and alignment faking](/topics/deception-detection/).
