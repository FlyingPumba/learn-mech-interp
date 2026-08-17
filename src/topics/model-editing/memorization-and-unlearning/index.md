---
title: "Memorization and Machine Unlearning"
description: "Defining and extracting memorized training data, testing whether its influence can be removed, and understanding why behavioral suppression is not evidence of unlearning."
order: 3
prerequisites:
  - title: "Localized Fact Editing and Its Pitfalls"
    url: "/topics/fact-editing/"
  - title: "LEACE and Linear Concept Erasure"
    url: "/topics/concept-erasure/"
glossary:
  - term: "Verbatim Memorization"
    definition: "A model's ability to reproduce a sufficiently long training sequence exactly when given an appropriate prefix or other eliciting context."
  - term: "Counterfactual Memorization"
    definition: "The change in a model's prediction on an example caused by including that example in training, estimated by comparing training runs that include or omit it."
  - term: "Machine Unlearning"
    definition: "Modifying a trained model so that specified training data no longer influences it, while preserving behavior and capabilities unrelated to the removal target."
---

## Removing a Passage Is Harder Than Hiding It

A model completes a distinctive fifty-token prefix with the next hundred tokens from a training document. After an unlearning procedure, that exact prompt no longer works. Has the document been removed?

The model might still reproduce the passage from a shorter prefix, a paraphrase, or a neighboring sentence. The update might suppress one output route while leaving the underlying information recoverable, just as a localized fact edit can override an old answer without erasing it. It might also damage broad language-model capabilities enough that the passage becomes harder to elicit for an unrelated reason.

> **Machine Unlearning:** Modifying a trained model so that specified training data no longer influences it, while preserving behavior and capabilities outside the removal target.

Evaluating unlearning therefore requires a definition of memorization, multiple extraction attempts, and utility controls. A single failed prompt is evidence about that prompt, not proof that the training example has ceased to influence the model.

## Verbatim Memorization and Extraction

**Verbatim memorization** means that a model can reproduce a sufficiently long training sequence exactly when it receives an effective context. Extraction turns that property into an attack: generate candidate continuations, rank unusually likely or model-specific strings, and verify whether the candidates occurred in training.

Carlini et al. extracted hundreds of verbatim sequences from GPT-2, including contact information, code, identifiers, and text found in only one training document {% cite "carlini2021extracting" %}. The study does not imply that every unique document is extractable. It establishes that public query access can reveal some rare training examples, and that the largest tested GPT-2 model was more vulnerable than smaller variants.

Prompt dependence complicates a binary label. A passage may be inaccessible from one prefix and reproduced exactly from another. Longer context provides more information about which continuation is required, so extraction success combines what the model retained with how well the attack identifies an eliciting prompt.

> **Verbatim Memorization:** The ability to reproduce a training sequence exactly under an appropriate eliciting context. Extraction is one test for this ability, not a complete inventory of everything training changed.

## Three Scaling Relationships

Measurements across language-model families found three approximately log-linear relationships in the studied regimes {% cite "carlini2023quantifying" %}:

- Increasing **model capacity** increases the amount of extractable memorization.
- Increasing **duplication count** makes a sequence more likely to be emitted verbatim.
- Increasing **prompt context length** makes extraction easier.

These variables interact. A sequence repeated many times can be recoverable from a smaller model or shorter prefix, while a rare sequence may require both a larger model and a highly specific context. The relationships also vary across model families, so they are empirical regularities rather than architecture-independent laws.

Deduplication reduces one driver of memorization but does not make extraction impossible. The GPT-2 extraction study recovered sequences associated with single documents, and a document can itself repeat a string internally. Privacy evaluation therefore cannot stop at document-level duplicate counts.

<details class="pause-and-think">
<summary>Pause and think: What did the attack measure?</summary>

Suppose a longer prefix makes a passage extractable. Did the model memorize more information when the prefix became longer?

No. The weights did not change. The longer prefix made existing information easier to elicit by narrowing the plausible continuation. Memorization measurements depend on both retained information and attack strength.

</details>

## Counterfactual Memorization

Exact reproduction can confuse memorization with ordinary generalization. A model that completes “The capital of France is” with *Paris* may have learned the association from many documents rather than retained any one sentence. Common phrases and near-duplicates dominate many extraction-based criteria.

**Counterfactual memorization** defines an example by the difference its inclusion makes to training {% cite "zhang2023counterfactual" %}. Train models on datasets that sometimes include document $z$ and sometimes omit it, then compare the prediction on $z$:

$$
\operatorname{mem}(z)
=
\mathbb{E}[L(M_{-z}, z)]
-
\mathbb{E}[L(M_{+z}, z)],
$$

where $M_{+z}$ was trained with $z$, $M_{-z}$ without it, and $L$ is prediction loss. A large positive value means including the document substantially improved the model’s prediction on that document.

This definition isolates the influence of one training example more directly than checking whether the final model emits a familiar phrase. Its cost is substantial: estimating the expectation requires many controlled training runs or a carefully designed approximation. It is therefore valuable for scientific measurement but usually unavailable for a closed model trained once.

Verbatim and counterfactual memorization answer different questions. Verbatim extraction asks whether an adversary can recover text. Counterfactual memorization asks whether including a document caused the model to predict it better. A document can score highly under one criterion and not the other.

## A Controlled Mechanistic Setup

Observing an extracted passage does not reveal where or how the model retained it. Huang et al. created a controlled setting by continuing pretraining from Pythia checkpoints while injecting selected sequences with known repetition counts {% cite "huang2024memorization" %}. Checkpoints before and after injection allow the memorized behavior to be studied without guessing whether a sequence occurred in an unknown corpus.

Non-trivial repetition was required for reliable verbatim generation in this setup. Later checkpoints memorized more readily than earlier checkpoints, including out-of-distribution sequences. Better general language modeling did not simply replace rote retention; it made the injected continuations easier to acquire and reproduce.

The trigger for a memorized continuation was distributed across model states encoding high-level properties of the context. Once triggered, generation relied heavily on capabilities also used for ordinary language modeling. The experiments challenge a simple picture in which a passage sits in one weight, neuron, or dedicated memory module waiting to be deleted.

This is a result from controlled continued pretraining of Pythia models, not proof that every kind of memorization in every model has the same mechanism. It does show that localizability must be tested rather than assumed.

## Stress-Testing Unlearning

An unlearning method can pass its construction metric by making the target completion unlikely under the prompt used during optimization. Stronger tests vary how the information is elicited and measure what else changed.

Useful tests include:

- Trying prefixes of different lengths and starting at different points in the passage.
- Using paraphrases or related contexts rather than the training string alone.
- Checking whether a small amount of retraining rapidly restores the behavior.
- Comparing likelihoods, not only greedy exact-match generations.
- Measuring general language-model loss and unrelated capabilities after removal.

In the study's GPT-Neo-125M stress tests, the tested unlearning methods often failed to eliminate memorized text under perturbed prompts while degrading general model quality {% cite "huang2024memorization" %}. The target behavior and ordinary language modeling drew on overlapping computation, so suppressing the former was not cleanly separable from damaging the latter.

The result resembles the insertion-versus-editing problem in [localized fact editing](/topics/fact-editing/). An update that changes the visible answer may add an override rather than remove the old influence. LEACE makes a narrower promise by eliminating linear decodability under stated assumptions; unlearning a training document asks for a broader causal guarantee over many possible uses of that document.

## What Would Count as Removal?

Exact equivalence to retraining without the target data is the cleanest conceptual standard. If an unlearned model behaved like a model that had never seen the document across every input, the target’s causal influence would be gone. For modern language models, training an exact comparison model is expensive and optimization randomness prevents simple parameter equality.

Practical evaluations approximate this standard with attack suites and utility measurements. A credible claim should specify:

1. Which notion of memorization is targeted.
2. Which prompts and attacks failed after unlearning.
3. Which related knowledge remained or disappeared.
4. How much unrelated model quality changed.
5. Whether the target can be recovered by probing, alternative decoding, or brief retraining.

No finite suite proves absence under all future attacks. It can show that removal survives a defined threat model while preserving a defined utility distribution.

## The Editing Target Determines the Guarantee

Model editing spans targets with different meanings. A factual edit changes selected outputs. Linear concept erasure removes a specified form of decodability. Machine unlearning seeks to remove the causal influence of training examples across all the ways a model might use them.

The broader target requires broader evaluation. Distributed memorization does not make unlearning impossible, but it makes a localized-edit story insufficient. A removal claim must survive stronger elicitation while preserving capabilities that share the same computation. Persistent memorization can also support black-box model provenance; [finetuning traces](/topics/finetuning-traces/) compare that ordering signal with activation-based evidence about what post-training changed.
