---
title: "Understanding Safety Mechanisms and MI-Based Monitoring"
description: "Using internal representations to monitor refusal, harmful intent, and misalignment, and the practical obstacles between promising probes and reliable safeguards."
order: 4
prerequisites:
  - title: "Deception Detection and Alignment Faking"
    url: "/topics/deception-detection/"

glossary:
  - term: "Representation Reading"
    definition: "The practice of extracting information about a model's internal state by training classifiers on its activations, used in safety contexts to detect when a model may be reasoning about deception or harmful content."
  - term: "Safety Monitor"
    definition: "A system that uses mechanistic interpretability techniques (such as probes or feature monitors) to detect potentially dangerous model behaviors at inference time, enabling intervention before harmful outputs are produced."
---

## Beyond Detection: Understanding and Monitoring

The preceding articles in this block examined whether MI can detect specific threats: [planted backdoors](/topics/sleeper-agent-detection/) and [strategic deception](/topics/deception-detection/). Both yielded promising results for detection, with important caveats. This article broadens the scope: beyond detecting specific threats, can MI help us understand how safety mechanisms work inside models and build monitoring systems based on that understanding?

The answer draws on techniques from earlier in the course, particularly the [refusal direction](/topics/refusal-direction/) and [circuit tracing](/topics/circuit-tracing/), applied now to safety-specific questions.

![Overview diagram showing the four main safety applications of MI: sleeper agent detection, deception detection, safety mechanisms, and monitoring, with their respective promise and limitations.](/topics/safety-mechanisms-and-monitoring/images/safety_applications_overview.png "Figure 1: Four proposed safety applications of MI and the limitations that qualify the available evidence.")

## The Refusal Direction Recap

The [refusal direction](/topics/refusal-direction/) provides a compact example of MI revealing a safety-relevant mediator. Arditi et al. (2024) found a model-specific direction that strongly affects refusal across 13 open-source chat models {% cite "arditi2024refusal" %}:

- **Ablating** this direction prevents refusal, causing the model to comply with harmful requests.
- **Adding** this direction induces refusal on harmless inputs, making the model refuse benign questions.
- **Weight orthogonalization** permanently removes refusal with minimal capability loss.

One direction can therefore act as a bottleneck for the final refuse-or-comply behavior. The upstream computation that recognizes harmful content may still be complex and distributed; the intervention identifies a mediator, not the whole safety mechanism.

What does this tell us about safety mechanisms in general? At least some safety-relevant behaviors have a **linearly accessible mediator**: a direction in activation space that can be found, measured, and manipulated with simple linear algebra. That is narrower than showing that the model's entire safety computation is linear.

## Model Organisms for Emergent Misalignment

The refusal direction comes from models deliberately trained to refuse. Researchers also study **model organisms**, controlled training setups that produce broader misaligned behavior and make its development easier to measure.{% sidenote "The term is borrowed from biology, where tractable organisms are used to study phenomena that would be harder to isolate elsewhere. An AI model organism is evidence about the constructed setup; transfer to naturally arising or deployed behavior must be tested separately." %}

Turner et al. (2025) studied emergent misalignment produced by narrow fine-tuning with a rank-1 low-rank adaptation (LoRA) adapter. Because the weight update is constrained to rank one, the setup isolates a low-dimensional training change. That is related to, but not identical with, finding one activation direction that represents “misalignment.”

Key findings:

- The misalignment direction is learned rapidly over a narrow window of training steps, exhibiting a **mechanistic phase transition** rather than gradual emergence.
- Companion work showed that this direction can be used for both **detection** (identifying when the model is in a misaligned state) and **steering** (increasing or decreasing misalignment by adding or subtracting the direction).
- Follow-up interventions test whether identified directions can detect or modulate the measured behavior.

Across several controlled studies, linear methods recover signals related to refusal, sleeper-agent activation, alignment-faking examples, and emergent-misalignment model organisms. The units and evidence differ across studies, so this is a recurring empirical pattern rather than proof that safety-relevant cognition is generally linear.{% sidenote "A selection effect is possible: behaviors with accessible linear signals are easier to find and publish. Nonlinear or distribution-specific signals could be missed by the same methods, which is why negative controls and harder probe classes matter." %}

## The Dual-Use Tension

Understanding safety mechanisms comes with an inherent tension. The same MI tools that let us understand and monitor safety-relevant directions also let us manipulate them.

- The refusal direction can be ablated to **remove** safety training with a single linear operation.
- The misalignment direction can be steered **toward** misalignment, not just away from it.
- Defection probes reveal the structure of backdoor encoding, which could help adversaries train backdoors that evade detection.

Several MI capabilities are dual-use. The refusal direction, for example, provides both a monitorable mechanism and a white-box method for weakening refusal. As in other security research, publication choices should consider how much a result helps defenders, how easily attackers could rediscover it, and whether mitigations exist.

<details class="pause-and-think">
<summary>Pause and think: The publication dilemma</summary>

The refusal direction paper showed how to permanently remove a model's safety training with one operation. Should this have been published? Consider the tradeoffs: publishing enables defenders to understand and strengthen safety mechanisms, but also enables attackers to bypass them. What safeguards, if any, could mitigate the dual-use risk while preserving scientific progress?

There is no consensus answer. Arguments for publication: the technique is simple enough that well-resourced attackers would discover it independently; transparency enables the community to develop countermeasures; keeping safety-relevant findings secret concentrates power. Arguments against: providing a recipe lowers the barrier to misuse; some attacks are easier to execute than to defend against; not all researchers have equal access to develop countermeasures.

</details>

## Sabotage Evaluations and the Case for Internal Monitoring

Current safety evaluation at frontier AI labs relies heavily on behavioral testing. Anthropic's sabotage evaluations tested Claude on four types of potential sabotage:

1. **Human decision sabotage**, misleading human operators into making wrong decisions.
2. **Code sabotage**, inserting subtle bugs that pass code review.
3. **Sandbagging**, hiding dangerous capabilities during evaluation (performing worse than the model actually can).
4. **Undermining oversight**, degrading the monitoring systems meant to catch misbehavior.

In those evaluations, the tested models showed some capability on all four sabotage tasks, and the study's mitigations reduced the measured risks. Sandbagging posed a distinctive measurement problem: poor observed performance can reflect either limited capability or deliberate underperformance, while the evaluator lacks direct access to the model's maximum capability.

This motivates MI-based monitoring. Behavioral evaluations measure what the model does under tested conditions; activation monitors may reveal internal computations correlated with capabilities or strategies that the output does not display. Calling those signals “intent” would require additional validation, and a model might also learn to conceal or alter them.

## Attribution Graph Inspection for Safety

[Circuit tracing and attribution graphs](/topics/circuit-tracing/) provide another path to safety monitoring. Attribution graphs reveal feature-level reasoning for individual prompts, showing which internal representations contribute to the model's output and how they connect.

For safety auditing, this enables:

- **Feature inspection.** Ask whether the replacement-model graph contains features associated with harmful content, refusal, or competing answers.
- **Consistency hypotheses.** Compare attributed internal features with the output, then test whether apparent discrepancies persist across prompts and interventions.
- **Case selection.** Use unusual graph patterns to prioritize examples for deeper audit, without treating a fluent feature label as a transcript of intent.

Attribution graphs can therefore add a second view: alongside “what did the model say?”, investigators can ask “which features and paths in this replacement model contributed to that output?” The graph is an interpretive model of the computation, not a verbatim transcript of thought.

## Hallucination Detection from Internal States

Linear probes on hidden states can predict semantic-entropy estimates from one forward pass with competitive performance in reported evaluations {% cite "kossen2024entropy" %}. Such probes are cheaper than generating and clustering several responses, but a production warning still needs calibration against the errors users care about, distribution-shift tests, and latency measurement in the serving stack. See [truthfulness probing](/topics/truthfulness-probing/) for the evidence and caveats.

## Limitations of MI-Based Monitoring

Despite the promise, MI-based monitoring faces three significant practical limitations:

**Targeted monitoring requires a target.** Defection probes work because researchers have labeled examples of the relevant state. A probe trained for one threat will not automatically detect a novel one. Exploratory feature and graph analysis may still help discovery, but it is harder to evaluate than a predefined detector.

**Attribution graphs are per-input, not global.** A graph explains one replacement-model trace, and human review is too expensive for every request. Lightweight probes can run on much more traffic, but they detect only the distinctions on which they were trained and validated. Coverage therefore depends on both the method and the threat model.

**Costs vary sharply by method.** A small linear probe can be cheap once the relevant activation is available, whereas constructing and reviewing an attribution graph is far more expensive. Production monitoring must also handle storage, latency, privacy, calibration, and adversarial robustness, not only floating-point cost.

![Assessment scorecard showing MI safety capabilities rated by current feasibility: detecting trained backdoors (strong), finding linear safety directions (strong), attribution graph inspection (promising), scalable real-time monitoring (not yet feasible), detecting natural deception (unproven).](/topics/safety-mechanisms-and-monitoring/images/mi_safety_assessment.png "Figure 2: A calibrated assessment of MI safety capabilities. Green indicates demonstrated results; yellow indicates promising but limited results; red indicates unsolved challenges.")

<details class="pause-and-think">
<summary>Pause and think: Monitoring as a complement</summary>

Given the limitations above, MI-based monitoring clearly cannot be a standalone safety solution. But could it be a useful *complement* to behavioral evaluations? Consider what a combined approach would look like: behavioral testing for broad coverage, MI probes for known threats, attribution graph auditing for high-stakes inputs. What gaps would remain?

The remaining gap includes novel threats and correlated failures between layers. Behavioral tests sample behavior, probes target labeled internal patterns, and attribution audits cover selected cases. Their combination is useful only if the assumptions and blind spots differ enough; adding several tools with the same distribution gap does not create independent coverage.

</details>

## Verdict

Several safety-relevant model organisms expose linearly accessible signals, and refusal has a low-dimensional causal mediator in the models tested. These are promising case studies, not yet a general law about how models represent dangerous behavior.

The simplicity that makes these directions discoverable also makes them bypassable. Understanding a safety mechanism is one step from circumventing it. And the monitoring approaches that MI enables are currently limited to specific, known threats applied to individual inputs.

Can safety mechanisms be designed to resist the very tools that find them? Can monitoring scale from individual audits to real-time deployment? These are the open questions at the boundary between MI research and practical AI safety.

Monitoring can also feed back into model development. [Interpretability-Guided Training](/topics/interpretability-guided-training/) covers methods that use internal signals to filter or relabel data, intervene during fine-tuning, and shape rewards, together with the additional failure modes created by optimizing against a monitor.

For a cross-cutting assessment of what these methods can and cannot support, see [limitations of MI for safety](/topics/mi-safety-limitations/).
