---
title: "Interpretability-Guided Training"
description: "Using internal concepts to filter and repair training data, steer activations during fine-tuning, and turn model features into optimization signals."
order: 8
prerequisites:
  - title: "Multi-Layer Steering"
    url: "/topics/multi-layer-steering/"
  - title: "Probes in Production"
    url: "/topics/probes-in-production/"

glossary:
  - term: "Activation-Based Data Attribution"
    definition: "Ranking training examples by similarity between the activation changes associated with those examples and a behavior-specific activation direction."
  - term: "Preventative Steering"
    definition: "Adding a behavior direction to activations during fine-tuning, then removing the intervention at deployment, with the aim of reducing how strongly the behavior is learned into the weights."
  - term: "Reinforcement Learning from Feature Rewards (RLFR)"
    definition: "Using scores read from model activations, usually through trained probes, as part of the reward for reinforcement learning."
---

## From Monitoring to Changing the Update

A probe normally leaves the model unchanged. It reads an activation and predicts whether a concept is present. A steering vector normally leaves the weights unchanged. It shifts an activation during inference and changes the current response. Training-loop methods use the same internal signals one step earlier, where they can influence which examples the model sees, which representations it processes during fine-tuning, or which outputs optimization rewards.

> **Interpretability-guided training:** Using an interpretable internal signal to alter training data, activations, or an optimization objective, followed by retraining and behavioral evaluation of the resulting model.

The method family is organized by where the signal enters:

| Intervention point | Internal signal | Training action |
| --- | --- | --- |
| Before an update | Direction, probe, or sparse feature | Filter, relabel, reweight, or generate data |
| During the forward pass | Concept direction | Add, remove, or otherwise transform an activation |
| In the objective | Probe or feature score | Supply part of a loss or reward |
| Across checkpoints | Probe, direction, or feature | Detect drift and decide whether to continue, stop, or revise training |

Bergen et al. (2026) place data filtering, inoculation prompting, activation steering, and reward shaping in one framework: each uses an interpreted concept to reshape the learning signal at a different stage {% cite "bergen2026anatomy" %}. This framing separates the reusable technique from any one paper's model, dataset, or target behavior.

<figure>
  <img src="images/learning-signal-interventions.png" alt="A post-training pipeline from preference data through model representations to a loss. Four interpretability-guided interventions branch from it: data filtering, inoculation prompting, activation steering, and reward shaping.">
  <figcaption>Internal concepts can influence post-training through data, representations, or the scalar objective. The causal claim comes from changing one of these inputs and retraining, not from inspecting a correlation alone. From Bergen et al., <em>Anatomy of Post-Training: Using Interpretability to Characterize Data and Shape the Learning Signal</em>. {%- cite "bergen2026anatomy" -%}</figcaption>
</figure>

## Editing the Data Before It Edits the Model

A training example can be scored by how strongly it pushes activations toward a behavior direction. Consider preference data with prompt $x_i$, chosen response $y_i^+$, and rejected response $y_i^-$. At a selected layer, compute a response-level difference

$$
\mathbf{d}_i = \mathbb{E}_{t\in y_i^+}[\mathbf{h}_{\ell,t}]
- \mathbb{E}_{t\in y_i^-}[\mathbf{h}_{\ell,t}].
$$

For an independently constructed behavior direction $\mathbf{b}$, the cosine score

$$
a_i = \frac{\mathbf{d}_i\cdot\mathbf{b}}
{\|\mathbf{d}_i\|\,\|\mathbf{b}\|}
$$

ranks examples by whether their chosen-versus-rejected contrast resembles the activation change associated with the target behavior. We can then inspect the highest-scoring examples, remove them, or reverse their preference labels.

> **Activation-based data attribution:** Comparing behavior-specific and training-example activation differences to rank examples that may contribute to the behavior.

Xiao and Aranguri (2026) apply this idea to 378,000 preference pairs used for Direct Preference Optimization (DPO) of OLMo 2 7B {% cite "xiao2026probedata" %}. They first build behavior vectors from responses to harmful requests, then compare those vectors with chosen-versus-rejected differences from the original checkpoint. Retraining after editing the ranked data supplies the causal test. Filtering the top 30,000 examples reduced distractor-triggered harmful compliance by 63%, while switching their labels reduced it by 78%. Once the probe was trained, ranking the full dataset cost more than ten times less than the evaluated gradient-attribution and LLM-judge baselines.

These numbers belong to one behavior, dataset, and training pipeline. The general lesson is methodological: similarity produces a hypothesis about responsible data, while editing and retraining test whether the ranked examples actually influence the behavior. A high attribution score without the retraining step could reflect a correlated style or topic.

Persona directions support a related form of data screening {% cite "chen2025persona" %}. Instead of scoring a response's raw projection, Chen et al. compare the training response with the base model's natural response to the same prompt and project that activation difference onto the persona direction. The comparison asks how the proposed example would shift the representation away from what the checkpoint already tends to produce. In their experiments, this relative score predicted which fine-tuning datasets would induce undesirable traits better than the raw response score.

Bergen et al. use sparse autoencoder (SAE) features to describe chosen and rejected responses in preference data {% cite "bergen2026anatomy" %}. Clusters of feature-level preference contrasts predicted downstream behavioral changes across controlled DPO runs with $R^2=0.9$, and targeted data modifications shifted the corresponding behaviors. The same workflow can therefore use hand-specified directions, trained probes, or unsupervised features. Each choice changes what can be found: a named direction tests a prior hypothesis, while a broad feature dictionary can surface patterns the researcher did not specify in advance.

## Preventative Steering During Fine-Tuning

Inference-time steering subtracts an undesirable direction after it has been learned. **Preventative steering** instead adds that direction during fine-tuning and removes the intervention when training ends {% cite "chen2025persona" %}. For an undesirable direction $\mathbf{v}_{\ell}$ and coefficient $\alpha>0$, the training-time residual becomes

$$
\mathbf{h}'_{\ell,t}=\mathbf{h}_{\ell,t}+\alpha\mathbf{v}_{\ell}.
$$

> **Preventative steering:** Supplying a concept direction in the activations during fine-tuning so the optimizer has less incentive to encode that same concept in the weights.

The positive sign is intentional. During ordinary fine-tuning, the optimizer must change the weights until the target behavior appears in the model's representations. If the activation intervention already supplies part of that representation, a smaller weight update may suffice. At deployment, removing the added vector leaves a model that learned less of the target behavior. This is the authors' explanation of the observed effect, not a theorem about gradient descent.

<figure>
  <img src="images/preventative-steering.png" alt="Two rows of line plots compare inference-time negative steering after fine-tuning with preventative positive steering during fine-tuning for evil behavior, sycophancy, and hallucination. Trait expression falls as steering strength increases; the top row also shows a larger decline in MMLU accuracy than the bottom row.">
  <figcaption>Post-hoc steering and preventative steering can both reduce measured trait expression, but they intervene at different times. In these experiments, preventative steering better preserved average MMLU accuracy at coefficients that reduced the target traits. From Chen et al., <em>Persona Vectors: Monitoring and Controlling Character Traits in Language Models</em>. {%- cite "chen2025persona" -%}</figcaption>
</figure>

Chen et al. tested the method on fine-tuning runs that induced evil behavior, sycophancy, or hallucination. Strong negative steering at inference reduced trait expression but could degrade MMLU accuracy. Adding the undesirable direction during fine-tuning reduced later trait acquisition, and multi-layer preventative steering approached the base model's MMLU performance in the tested settings. A direct penalty on projection change was less effective, which the authors attribute to the model learning around the measured direction.

Inoculation prompting follows the same training-only logic at the input level. Bergen et al. add a concept-bearing context to training prompts, then omit it at deployment {% cite "bergen2026anatomy" %}. Both methods change the representation seen by the optimizer rather than deleting examples. Their success depends on the intervention continuing to represent the intended concept throughout training.

<details class="pause-and-think">
<summary>Pause and think: What if the model routes around the direction?</summary>

Suppose a projection penalty stays near zero during fine-tuning, but the undesirable behavior still increases. Has the regularizer succeeded?

No. It has constrained one measured coordinate, not the behavior itself. The optimizer may encode the same behavior in another direction, layer, or nonlinear pattern. Evaluate the final model behaviorally, sweep layers and related directions, and test whether a freshly trained probe recovers the signal elsewhere. A stable old probe score is not evidence that the underlying behavior stayed fixed.

</details>

## Turning Features into Rewards

Filtering and preventative steering influence supervised updates. Reinforcement learning can use an internal score directly in its objective.

> **Reinforcement Learning from Feature Rewards (RLFR):** Reinforcement learning in which a probe or feature score supplies part of the reward for a behavior that is expensive to judge directly.

Prasad et al. (2026) demonstrate RLFR on hallucination correction with Gemma-3-12B-Instruct {% cite "prasad2026features" %}. An expensive grader first labels factual spans and whether proposed corrections or retractions resolve them. The authors use those labels to train four activation probes: two localize and classify candidate hallucinations, while two score the quality of corrections and retractions. Reinforcement learning then rewards interventions that the latter probes judge successful.

<figure>
  <img src="images/features-as-rewards.png" alt="A comparison between supervision for open-ended tasks using a verifier or language-model judge and an alternative that reads model features with a reward probe. A curve illustrates the probe score tracking the probability that a statement is true.">
  <figcaption>Feature rewards amortize an expensive supervision source into a cheap internal readout. They do not eliminate the source: labeled examples and external checks are still needed to train and validate the probe. From Prasad et al., <em>Features as Rewards: Scalable Supervision for Open-Ended Tasks via Interpretability</em>. {%- cite "prasad2026features" -%}</figcaption>
</figure>

The reward is not a probe score in isolation. It multiplies the relevant correction or retraction probe score by checks for legibility and substantive relevance. During training, the probe is run on the base model's activations for the candidate intervention rather than on the changing student's activations. Keeping the readout model fixed makes the reward function more stationary, although the student can still find outputs that exploit its blind spots.

With best-of-32 intervention sampling and the complete monitoring-and-intervention harness, the trained policy was 58% less likely to hallucinate than the base model in the reported evaluation. The feature-based reward cost about 90 times less per rewarded intervention than the ground-truth supervision source, and the probes could also rank interventions at test time. Standard benchmark performance was comparable between the trained and base policies in this study.

The 58% figure combines three effects: a less hallucinatory policy, in-context corrections inserted by the monitoring pipeline, and direct resolution of detected hallucinations. RLFR alone therefore should not receive credit for the entire reduction. The experiment also covers one 12B model and one open-ended behavior, with LLM-generated labels and rubric checks still present in the pipeline.

## What Counts as Evidence?

Training-loop claims become stronger as they move from prediction to intervention:

| Evidence | Supports | Does not yet support |
| --- | --- | --- |
| Internal score correlates with behavior | The property is readable on that distribution | The signal causes the behavior |
| Steering the signal changes behavior | The direction or feature is a causal handle | The representation is unique or complete |
| Ranked data are edited and the model is retrained | Those data causally influence the measured behavior | The ranking will transfer to another pipeline |
| Optimizing a feature reward improves held-out behavior | The signal can guide learning in that setup | The policy has not learned to game the signal |

This ladder prevents two common category errors. A monitor is not automatically a training objective, because optimization can exploit errors that were rare under passive evaluation. A data-ranking correlation is not attribution until modifying the ranked examples predictably changes a retrained model.

## Failure Modes and Evaluation

Optimization pressure changes the distribution on which an interpretability signal is evaluated. Five checks are therefore load-bearing:

1. **Refresh the readout.** Compare the original probe with probes retrained on later checkpoints. Disagreement can reveal representation drift or rerouting.
2. **Keep behavioral holdouts.** Measure the target behavior with evaluators that were not used to construct the internal signal.
3. **Test neighboring concepts.** A direction for hallucination may also track sycophancy, negativity, or response style. Report those cross-trait effects.
4. **Track capabilities and side effects.** Data removal, activation shifts, and shaped rewards can each change accuracy, calibration, refusal, or fluency.
5. **Attack the signal.** Search for outputs that score well internally while failing the external task, then add them to evaluation and, where appropriate, training.

Feature non-uniqueness remains a common limitation across all three intervention points. A model can encode one behavior through several correlated directions; an SAE can split one concept across features; and a probe can rely on a shortcut. Internal access also does not remove data and compute costs. Persona screening requires comparison generations, causal data attribution requires retraining, and feature rewards require labeled examples plus repeated adversarial validation.

## Looking Ahead

Interpretability-guided training closes a loop: internal representations can select data, alter the forward pass, and supply optimization signals, while checkpoint monitoring tests what the updates changed. The loop is only as reliable as its independent behavioral evaluation.

These methods change weights indirectly by altering optimization. [Localized Fact Editing](/topics/fact-editing/) begins the next block with a more direct route: writing a targeted change into the model's parameters, then testing whether the edit remains specific and generalizes beyond its construction prompts.

Concept directions, probes, and sparse features can all supply training signals, but they have different failure modes. The later [Sparse Autoencoders](/topics/sparse-autoencoders/) block asks how a broad dictionary of features can be learned from superposed activations, and why reconstruction quality alone does not guarantee that the resulting features are the right units for training control.
