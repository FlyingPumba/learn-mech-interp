---
title: "Training Models to Explain Their Computations"
description: "Training models to describe internal computations, including reusable adapters that report deliberately implanted behaviors in held-out models."
order: 5
prerequisites:
  - title: "Testing Introspection with Concept Injection"
    url: "/topics/concept-injection/"

glossary:
  - term: "Introspection Adapter"
    definition: "A shared lightweight adapter trained across model organisms with known implanted behaviors, then used to elicit behavioral self-reports from held-out fine-tunes."
---

## Beyond Zero-Shot Interpretation

[Patchscopes](/topics/patchscopes/) and [SelfIE](/topics/selfie-interpretation/) rely on prompting to elicit interpretations. [Concept injection](/topics/concept-injection/) then tests whether one kind of self-report changes with a known internal intervention. None of these methods trains a dedicated reporting interface.

But what if models do not naturally explain themselves well? Prompting might produce plausible-sounding descriptions that are not faithful to actual computations. Li et al. {% cite "li2025training" %} investigate a different approach: explicitly *training* models to generate accurate explanations of their internal processes.

> **Trained Self-Explanation:** Fine-tuning a language model to reproduce explanation targets derived from existing interpretability methods. The resulting model can amortize those methods, but cannot be more faithful than its targets without independent validation.

## What Explanations Are Trained

The work focuses on three types of computational explanations:

### Feature Descriptions

What do internal features encode? Given an activation pattern, the trained model should describe what concept or property that pattern represents.

For training data, the authors use targets from methods such as [sparse-autoencoder](/topics/sparse-autoencoders/) feature analysis. If a latent has been labeled “mentions of US presidents,” its activation examples can supervise that description. The label is inherited evidence, not literal ground truth: any weakness in the original feature analysis enters the training set.

### Causal Structure

How do components influence each other? Given information about which model components affect which outputs, the trained model should describe these causal relationships.

Techniques like [activation patching](/topics/activation-patching/) and [attribution patching](/topics/attribution-patching/) provide supervision. If patching attention head 9.1 changes “Paris” to “London,” a careful target can say that this replacement changed the city prediction. Saying the head “is responsible for retrieving the city” adds a mechanistic interpretation that the patch alone does not establish.

### Token Influence

Which input tokens affect the output? Given information about how input tokens contribute to predictions, the trained model should articulate these dependencies.

Methods like gradient-based attribution provide supervision. If the token "French" strongly influences predicting "Paris," this becomes training data for explaining input-output relationships.

## Comparing Self- and External Explanation

On the study's explanation targets and evaluation metrics, fine-tuned self-explainers outperform the tested external explainers, including some larger models. That is not the result we would get by assuming linguistic sophistication alone determines explanation quality: a larger model $M$ might describe a smaller model $S$ fluently while lacking a well-matched interface to $S$'s internal state. The result is specific to the study's targets and scoring procedure; it does not establish privileged or generally faithful introspective access.

<details class="pause-and-think">
<summary>Pause and think: Why might self-explanation work better?</summary>

What mechanisms could explain why self-explanation outperforms external explanation?

Several possibilities:
1. **Shared representations:** When a model explains itself, the input (the internal state) and the explainer share the same representational basis.
2. **Privileged access:** The model has direct access to information about its own computations that cannot be fully communicated to an external system.
3. **Alignment of training:** The same training that produced the internal representations also shapes how the model uses language, creating natural correspondences.

One hypothesis is that a shared representational basis gives self-explanation an advantage on these tasks. Another is that the self-explainer is better matched to the training labels. Distinguishing those explanations requires evaluations whose targets do not come from the same interpretation pipeline.

</details>

## Training Procedure

The training pipeline works as follows:

1. **Generate explanation targets.** Run SAE analysis, patching, or attribution to produce descriptions of internal states and effects.

2. **Create training examples.** Pair internal states or computation patterns with their ground-truth explanations.

3. **Fine-tune the model.** Train the model to generate the correct explanation given the internal state as input.

4. **Evaluate generalization.** Test on held-out examples to measure whether the trained explainer generalizes beyond its training distribution.

Explainer models trained on tens of thousands of examples generalize to held-out queries under the study's metrics. This is evidence against simple example memorization, while still leaving open whether the learned pattern is the target method's regularity or the model's underlying mechanism.

## A Different Source of Ground Truth

The targets above come from interpretability methods applied to one model. Introspection adapters use a complementary design: first create models whose behavioral differences are known because the experimenter deliberately trained them in {% cite "shenoy2026introspection" %}.

Start with a base model $M$ and make a collection of fine-tuned **model organisms** $M_1,\ldots,M_n$. Each receives a known behavior $b_i$, such as a risk preference, a hidden trigger, selective sandbagging, or a response-format quirk. The training examples need not explicitly name the behavior, so a model cannot answer merely by quoting a supplied label.

> **Introspection adapter:** A single lightweight adapter trained across many model organisms to verbalize which learned behavior each organism has. The same adapter is then attached to held-out fine-tunes with unseen behaviors.

One shared LoRA adapter $A$ is attached in turn to every training organism. Given questions about the model's tendencies, the composite model $M_i + A$ is trained to report $b_i$. Evaluation then attaches that exact adapter to a held-out organism $M_j$ whose behavior and training procedure were not used to train $A$:

$$
(M_i + A,\; \text{question}) \longrightarrow \text{report of } b_i
$$

The adapter cannot solve this test from a fixed answer associated with its own weights, because its weights do not change between organisms. It must use something that differs across the base fine-tunes. This design does not prove what information it reads or where that information is stored, but it gives the report a clearer target than an open-ended explanation of ordinary computation.

The pipeline below keeps the reporting adapter fixed while the behavior-bearing fine-tune changes. Training across several behavior families matters: an adapter trained on only one family tends to treat familiar training behaviors as its vocabulary of possible explanations. More diverse model organisms improve transfer to unseen behavior families, with diminishing returns in the reported experiments.

<figure>
  <img src="/topics/training-self-explanation/images/introspection-adapter.png" alt="Introspection adapter pipeline. A common base model is fine-tuned into model organisms with known behaviors, one shared adapter learns to report those behaviors, and the adapter is evaluated on a held-out organism with a new behavior.">
  <figcaption>A shared introspection adapter is trained across model organisms with known behaviors, then transferred to a held-out fine-tune. From Shenoy et al., <em>Introspection Adapters: Training LLMs to Report Their Learned Behaviors</em>. {% cite "shenoy2026introspection" %}</figcaption>
</figure>

Supervised fine-tuning teaches the basic reporting task. A later preference-training stage uses reports from held-out organisms, paired with judgments of which reports are accurate, to improve calibration. The extra stage is needed because the supervised adapter often guesses a behavior from its training distribution even when none is present.

## What Transfers?

On AuditBench, which contains 56 model organisms across 14 behavior types, the introspection-adapter investigator scored 59%, compared with 53% for the next-best tested investigator and 44% for the strongest tested white-box Activation Oracle. When individual reports were judged directly, the adapter verbalized the correct implanted behavior for 50 of the 56 organisms. It also surfaced seven of nine covert behaviors represented through learned ciphers when used inside an investigation scaffold {% cite "shenoy2026introspection" %}. [Auditing games](/topics/mi-safety-limitations/#auditing-games-test-the-tool-in-an-investigation) explain why performance inside an investigation is a different test from scoring reports or features in isolation.

Across the tested Qwen models, direct behavior verbalization rose from 37.7% at 0.6B parameters to 77.3% at 14B, while prompting without the adapter remained below 10%. Holding out whole behavior categories produced much better transfer after the adapter had trained across several distinct categories, rather than many examples of one category. Both model scale and training diversity improve transfer in these experiments.

In a reward-model case study, the adapter surfaced 16 of 52 learned preferences and usually described behavioral tendencies rather than identifying the root reward objective. A model trained to prefer long answers might report verbosity without reporting that a reward model caused it. That is useful auditing evidence, but it is not a mechanistic explanation of the training process.

Concept injection and introspection adapters validate different claims. [Concept injection](/topics/concept-injection/) manipulates a known current state and asks whether the report changes, giving within-model causal evidence. An introspection adapter holds the reporting intervention fixed and varies a known learned behavior across models, testing transfer between model organisms. Neither result licenses treating arbitrary chain-of-thought or self-description as faithful.

## Faithfulness Considerations

Training for explanation introduces a tension. We want descriptions to track the actual computation, but the objective rewards matching targets produced by existing interpretation methods. If those targets are imperfect, the trained model can reproduce their mistakes fluently.

Li et al. address this by:

- Using multiple independent interpretability techniques as cross-validation
- Testing generalization to novel scenarios not seen during training
- Comparing self-explanation to external explanation as a consistency check

The generalization results are encouraging. Models do not simply memorize training explanations; they learn patterns that transfer to new situations. This suggests the explanations capture genuine regularities in how the model computes.

Introspection adapters replace inherited explanation labels with known training interventions. Their strongest evidence is transfer to a held-out model organism, especially when its behavior and fine-tuning procedure are both novel. The adapter could still learn behavioral fingerprints or other correlates rather than read a model's internal representation of its own propensity. Causal localization would require additional interventions on the states that drive the report.

## Scalability

A key advantage of trained explainers is scalability. Once trained, the explainer can generate explanations for new internal states without rerunning expensive interpretability techniques.

Consider the alternative: analyzing each SAE feature individually requires extensive human effort or automated analysis. A trained explainer can describe new features by leveraging patterns learned from previously analyzed features.

This creates a bootstrapping opportunity:
1. Analyze a subset of internal states using expensive techniques
2. Train an explainer on this subset
3. Use the explainer to analyze the remaining states
4. Optionally, validate a sample of generated explanations

The approach scales interpretation capacity without proportionally scaling interpretation cost.

## Limitations

**Ground truth dependency.** The method is only as good as the interpretability techniques that provide training data. If those techniques are biased or incomplete, the trained explainer inherits their limitations.

**Distribution shift.** Explainers may not generalize well to internal states very different from their training distribution. Novel computations may require new training data.

**Explanation vs. understanding.** Generating accurate explanations does not guarantee that the explanations are useful for human understanding. The model might produce technically correct but uninformative descriptions.

**Computational cost.** Training requires substantial compute for generating ground-truth explanations and fine-tuning. This may limit applicability to very large models.

**Adapter hallucination.** Introspection adapters can report behaviors from their training distribution that the target model does not have. Preference training reduces this failure but does not eliminate it, so audits need controls on the original base model and organisms with known absent behaviors.

**Adversarial limits.** A deliberately evasive model may hide a behavior, manipulate the investigation, or encode it outside the patterns the adapter learned to read. Results on covert and adversarially trained organisms are promising but do not settle stronger threat models.

## Implications for Interpretability

The finding that self-explanation outperforms external explanation has important implications:

**Self-reference is testable.** Rather than treating interpretation as purely external, we can compare reports across controlled internal interventions or controlled changes to learned behavior.

**Scaling interpretation.** As models grow, human interpretation capacity does not scale. Trained self-explainers and reusable adapters can amortize part of an audit, while leaving validation to targeted tests.

**Complementary to other methods.** Trained explanation does not replace techniques like patching or probing. It builds on them, using their outputs as training data to create more scalable interpretation tools.

## Looking Ahead

Training models to explain themselves is promising, but the supervision source determines what a successful report means. [LatentQA](/topics/latentqa/) takes a related approach with a different framing: rather than generating open-ended explanations, it formulates interpretation as question-answering. This structured format enables more systematic evaluation and potentially more reliable responses.
