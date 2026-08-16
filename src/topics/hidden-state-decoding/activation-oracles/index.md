---
title: "Activation Oracles"
description: "Training one activation interpreter across varied tasks, then testing which natural-language questions and held-out activation settings it can answer reliably."
order: 7
prerequisites:
  - title: "LatentQA and Latent Interpretation Tuning"
    url: "/topics/latentqa/"
---

## From Specialized to General-Purpose

[LatentQA](/topics/latentqa/) demonstrated that we can train decoders to answer questions about activations. But those decoders are trained on specific tasks: sentiment analysis, entity recognition, or property detection. What happens if we train on *many* diverse tasks simultaneously?

Activation Oracles, introduced by Karvonen et al. {% cite "karvonen2025activationoracles" %}, pursue this direction. They train one decoder on a broad task mixture, then evaluate transfer to held-out questions and activation sources.

> **Activation Oracle (AO):** A language model trained via LatentQA on several interpretation tasks. It accepts activations and natural-language questions, producing answers whose generalization must be measured on held-out tasks and models.

## Training for Breadth

Activation Oracles are trained on several task families so that success cannot depend on one fixed label space:

**Classification tasks.** Training on many different classification problems (sentiment, topic, named entity, etc.) teaches the oracle to detect diverse properties in activations.

**Self-supervised context prediction.** Given an activation, predict properties of the surrounding context. This does not require labeled data; the context itself provides supervision.

**Narrow task-specific datasets.** Specialized datasets targeting specific interpretation challenges add precision to broad capabilities.

The combination matters. Each task type contributes different knowledge:
- Classification teaches property detection
- Context prediction teaches holistic understanding
- Specialized tasks teach fine-grained discrimination

In the reported comparisons, the mixed-task oracle transfers better across several evaluations than decoders trained on narrower mixtures.

## The Generalization Result

The main generalization test uses information introduced by fine-tuning:

The main test asks whether an AO can recover information introduced by fine-tuning even though its own training mixture did not include activations from those fine-tuned variants.

Consider a model fine-tuned to associate "Alice" with specific biographical information. The fine-tuning changes the model's weights but does not change the LatentQA training data (which was collected before fine-tuning). Nevertheless, the AO can query the fine-tuned model's activations and recover the newly learned biographical knowledge.

This is consistent with the oracle learning transferable structure in activations. It could also exploit similarities between the fine-tuned activations and its training distribution, so the result does not identify a universal activation code.

<details class="pause-and-think">
<summary>Pause and think: What does this generalization tell us?</summary>

The AO was never trained on fine-tuned model activations, yet it can extract fine-tuned knowledge from them. What does this imply about how knowledge is represented?

Possibilities:
1. **Shared structure:** Fine-tuned knowledge is encoded using the same representational primitives as pre-training knowledge.
2. **Compositional patterns:** The AO learns compositional rules that generalize to novel combinations.
3. **Surface similarities:** Fine-tuned activations happen to resemble training activations in ways the AO can exploit.

The ability to generalize to fine-tuned models is particularly relevant for safety: we can audit models for capabilities added after initial training without retraining interpretation tools.

</details>

## Matching White-Box Baselines

A natural question: how do AOs compare to white-box methods that have full access to model internals (weights, gradients, etc.)?

On most tasks in the reported benchmark, AOs match or exceed the selected white-box baselines.

This is noteworthy because AOs operate purely through natural language interrogation. They do not compute gradients, analyze attention patterns, or inspect specific components. They simply ask questions and interpret answers.

Natural-language question answering can therefore serve as a useful common interface on these tasks. It does not replace specialized causal tools when the question is whether a representation is used, where it came from, or how an answer would change under intervention.

## Recovering Malign Propensities

Beyond benign biographical information, AOs can detect "malign propensities" fine-tuned into models. If a model has been trained to have harmful tendencies that it conceals in normal text output, can the AO detect this from activations?

In the model organisms studied, the oracle recovers information about fine-tuned malign propensities that ordinary text outputs conceal. Whether this extends to naturally arising or adversarially hidden propensities remains open.

The flip side is that bad actors could use similar techniques to probe for hidden capabilities. This dual-use concern is consistent with other hidden state decoding methods; the techniques that enable safety auditing also enable capability extraction.

## The Role of Training Diversity

Ablation studies reveal that training diversity is the key to generalization:

| Training Setup | Generalization Quality |
|----------------|------------------------|
| Single task | Poor |
| Multiple similar tasks | Moderate |
| Diverse task types | Strong |

Adding classification and self-supervised tasks improved transfer in the study's ablations. The result supports broader training mixtures for this setup without establishing that breadth alone is sufficient for general-purpose interpretation.

In these experiments, diversity mattered more than simply adding examples from one task family. A practical next step is therefore to broaden the training mixture and measure transfer to genuinely held-out task types. More diversity may help, but each added task does not automatically produce general-purpose interpretation.

## Practical Advantages

AOs offer several practical benefits over specialized interpretation tools:

**Unified interface.** One model handles many different interpretation queries. Researchers do not need to maintain separate tools for each analysis type.

**Natural language.** Questions and answers are in plain language. Domain experts can query models without understanding the technical details of probing or patching.

**Scalability.** Once trained, the AO can analyze many activations quickly. Interpretation cost scales with the number of queries, not with tool development effort.

**Adaptability.** New question types can be explored without retraining. If the AO has learned relevant underlying patterns, it may answer novel questions correctly.

## Limitations

**Training cost.** Creating diverse training data and training the oracle requires substantial compute. This may limit who can build competitive AOs.

**Base model dependence.** AOs are trained on activations from specific models. Generalization to very different architectures may be limited.

**Faithfulness uncertainty.** AOs produce fluent answers, but fluency does not guarantee correctness. Validation against ground truth remains important. Controlled changes to known internal states or learned behaviors, as used in [concept injection](/topics/concept-injection/) and [introspection-adapter experiments](/topics/training-self-explanation/#a-different-source-of-ground-truth), provide stronger tests than agreement with another fluent explanation.

**Adversarial robustness.** If models learn to encode information in ways that evade AO detection, the approach may become less effective. There is potential for an arms race between encoding and detection.

## What Generality Has Been Demonstrated?

Activation Oracles show that one trained decoder can perform several activation-interpretation tasks competitively with selected specialized baselines. General-purpose here means breadth across the tested task mixture, not reliable answers to arbitrary questions about arbitrary models.

The approach aims for interpretation that is:
- **General:** One tool for many tasks
- **Scalable:** Language model inference rather than custom analysis
- **Accessible:** Natural language rather than technical methods

The remaining question is whether that convenient interface can be calibrated well enough that users know when its fluent answer is unsupported.

## Looking Back at the Block

We have traced an arc through hidden state decoding:

1. [**Introduction**](/topics/hidden-state-decoding-intro/) established the goal: translating activations to natural language.
2. [**Patchscopes**](/topics/patchscopes/) showed that patching activations into prompts elicits interpretable generation.
3. [**SelfIE**](/topics/selfie-interpretation/) demonstrated self-interpretation and control through embedding injection.
4. [**Concept injection**](/topics/concept-injection/) tested whether self-reports track a known internal perturbation.
5. [**Training self-explanation**](/topics/training-self-explanation/) covered both explainers trained on interpretation targets and a shared adapter that reports known behaviors in held-out model organisms.
6. [**LatentQA**](/topics/latentqa/) reframed interpretation as Q&A, enabling diverse queries and differentiable control.
7. **Activation Oracles** trained one decoder across several task families and matched selected specialized baselines on the reported evaluations.

The sequence moves from targeted readouts toward broader learned decoders. These methods can recover useful information from hidden states; explaining how a model computes, rather than what one state contains, remains a harder causal problem.

<details class="pause-and-think">
<summary>Pause and think: What comes next?</summary>

Activation Oracles can explain activations and generalize to novel settings. What capabilities are still missing?

Consider:
- Can AOs explain *why* a model computes something, not just *what* it computes?
- Can AOs trace causal chains through computation, not just describe static states?
- Can AOs handle models with very different architectures from their training?
- Can AOs resist adversarial attempts to hide information?

These open questions suggest directions for future work in hidden state decoding.

</details>

## Looking Ahead

Activation Oracles still depend on supervision: someone has to know what an activation encodes in order to build the training data. The next article, [Natural Language Autoencoders](/topics/natural-language-autoencoders/), removes that dependency. It trains a verbalizer and a reconstructor to autoencode activations through a natural-language bottleneck, so the explanations come from a reconstruction objective instead of from labels.
