---
title: "Activation Oracles"
description: "General-purpose activation explainers trained on diverse interpretation tasks, capable of recovering information from fine-tuned models and matching white-box baselines through natural language interrogation."
order: 6
prerequisites:
  - title: "LatentQA and Latent Interpretation Tuning"
    url: "/topics/latentqa/"
---

## From Specialized to General-Purpose

[LatentQA](/topics/latentqa/) demonstrated that we can train decoders to answer questions about activations. But those decoders are trained on specific tasks: sentiment analysis, entity recognition, or property detection. What happens if we train on *many* diverse tasks simultaneously?

Activation Oracles, introduced by Karvonen et al. {% cite "karvonen2025activationoracles" %}, pursue this direction. By training on a broad range of interpretation tasks, they aim to create general-purpose activation explainers that can answer novel questions about novel activations, even in settings never seen during training.

> **Activation Oracle (AO):** A language model trained via LatentQA on diverse interpretation tasks to serve as a general-purpose activation explainer. AOs accept activations as input and answer natural language questions about their content, generalizing beyond their training distribution.

## Training for Breadth

The key insight is that diverse training produces general capability. The authors train AOs on multiple task types:

**Classification tasks.** Training on many different classification problems (sentiment, topic, named entity, etc.) teaches the oracle to detect diverse properties in activations.

**Self-supervised context prediction.** Given an activation, predict properties of the surrounding context. This does not require labeled data; the context itself provides supervision.

**Narrow task-specific datasets.** Specialized datasets targeting specific interpretation challenges add precision to broad capabilities.

The combination matters. Each task type contributes different knowledge:
- Classification teaches property detection
- Context prediction teaches holistic understanding
- Specialized tasks teach fine-grained discrimination

Training on all simultaneously produces oracles that exceed any single-task baseline.

## The Generalization Result

The most striking finding concerns out-of-distribution generalization:

**AOs can recover information fine-tuned into a model that does not appear in the input text, despite never being trained on activations from fine-tuned models.**

Consider a model fine-tuned to associate "Alice" with specific biographical information. The fine-tuning changes the model's weights but does not change the LatentQA training data (which was collected before fine-tuning). Nevertheless, the AO can query the fine-tuned model's activations and recover the newly learned biographical knowledge.

This suggests that AOs learn something general about how information is encoded in activations, not just pattern matching against training examples. The activation patterns for "newly fine-tuned knowledge" share structure with patterns the AO learned from its original training.

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

The results are encouraging:

**AOs match or exceed white-box baselines on most evaluated tasks.**

This is noteworthy because AOs operate purely through natural language interrogation. They do not compute gradients, analyze attention patterns, or inspect specific components. They simply ask questions and interpret answers.

The implication is that natural language question-answering may be a sufficient interface for many interpretation needs. We do not always need specialized tools for each analysis; a well-trained oracle can handle diverse queries through a unified interface.

## Recovering Malign Propensities

Beyond benign biographical information, AOs can detect "malign propensities" fine-tuned into models. If a model has been trained to have harmful tendencies that it conceals in normal text output, can the AO detect this from activations?

The experiments suggest yes. Activations encode information about model propensities even when the model's text outputs do not reveal them. This has obvious safety implications: AOs could help detect covertly harmful models.

The flip side is that bad actors could use similar techniques to probe for hidden capabilities. This dual-use concern is consistent with other hidden state decoding methods; the techniques that enable safety auditing also enable capability extraction.

## The Role of Training Diversity

Ablation studies reveal that training diversity is the key to generalization:

| Training Setup | Generalization Quality |
|----------------|------------------------|
| Single task | Poor |
| Multiple similar tasks | Moderate |
| Diverse task types | Strong |

Adding classification tasks improves performance. Adding self-supervised tasks improves further. The lesson is that general-purpose interpretation requires general-purpose training.

This suggests a path forward: to build more capable AOs, we should collect and train on increasingly diverse interpretation tasks. Each new task type may unlock capabilities that transfer to tasks we have not anticipated.

## Practical Advantages

AOs offer several practical benefits over specialized interpretation tools:

**Unified interface.** One model handles many different interpretation queries. Researchers do not need to maintain separate tools for each analysis type.

**Natural language.** Questions and answers are in plain language. Domain experts can query models without understanding the technical details of probing or patching.

**Scalability.** Once trained, the AO can analyze many activations quickly. Interpretation cost scales with the number of queries, not with tool development effort.

**Adaptability.** New question types can be explored without retraining. If the AO has learned relevant underlying patterns, it may answer novel questions correctly.

## Limitations

**Training cost.** Creating diverse training data and training the oracle requires substantial compute. This may limit who can build competitive AOs.

**Base model dependence.** AOs are trained on activations from specific models. Generalization to very different architectures may be limited.

**Faithfulness uncertainty.** AOs produce fluent answers, but fluency does not guarantee correctness. Validation against ground truth remains important.

**Adversarial robustness.** If models learn to encode information in ways that evade AO detection, the approach may become less effective. There is potential for an arms race between encoding and detection.

## The Bigger Picture

Activation Oracles represent a maturation of the hidden state decoding paradigm. Where earlier methods demonstrated feasibility, AOs demonstrate practicality. A single, well-trained model can perform diverse interpretation tasks competitively with specialized tools.

This suggests a future where interpretation capabilities are:
- **General:** One tool for many tasks
- **Scalable:** Language model inference rather than custom analysis
- **Accessible:** Natural language rather than technical methods

The field is moving from proving that LLMs can interpret activations to routinely using LLMs as the default interpretation interface.

## Looking Back at the Block

We have traced an arc through hidden state decoding:

1. [**Introduction**](/topics/hidden-state-decoding-intro/) established the goal: translating activations to natural language.
2. [**Patchscopes**](/topics/patchscopes/) showed that patching activations into prompts elicits interpretable generation.
3. [**SelfIE**](/topics/selfie-interpretation/) demonstrated self-interpretation and control through embedding injection.
4. [**Training self-explanation**](/topics/training-self-explanation/) found that models explain themselves better when explicitly trained to do so.
5. [**LatentQA**](/topics/latentqa/) reframed interpretation as Q&A, enabling diverse queries and differentiable control.
6. **Activation Oracles** scaled this to general-purpose, matching specialized tools through broad training.

The trajectory shows increasing ambition: from targeted inspection to general-purpose explanation. Hidden state decoding is no longer a research curiosity but a practical approach to understanding what models know and how they compute.

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
