---
title: "Limits of Mechanistic Interpretability for Safety"
description: "Where mechanistic interpretability can fail as a safety tool, from misleading feature labels and incomplete decompositions to scaling and coverage gaps."
order: 5
prerequisites:
  - title: "Safety Mechanisms and MI-Based Monitoring"
    url: "/topics/safety-mechanisms-and-monitoring/"
---

## From Case Studies to Assurance

The preceding articles presented several safety applications with different evidence. [Defection probes](/topics/sleeper-agent-detection/) detect trained backdoors but may not transfer to other threats. [Internal probes](/topics/deception-detection/) detect alignment-faking examples, while the tested sparse autoencoders lose some of that signal. A [refusal direction](/topics/refusal-direction/) is easy to intervene on, but refusal is only one part of model safety.

This article steps back to examine limitations that recur across MI-based safety approaches. Not every limitation applies equally to every method, but each changes what conclusion the evidence can support.

Calibration matters because a useful detector can still create false confidence if its operating conditions are forgotten. The right question is not whether an MI tool “works,” but which threat, model, input distribution, and error rate it has actually been tested against.

## Limitation 1: Interpretability Illusions

The foundation of MI is that we can look at model internals and correctly understand what we see. But what if our interpretations are wrong?

Bolukbasi et al. (2021) showed that plausible explanations based on top-activating examples can track a correlate rather than the underlying cause. A neuron that activates on many dog images might respond to a recurring texture, for example. Top examples are therefore evidence for a label, not a complete definition of the unit.

This problem is pervasive in MI:

- **Feature labeling.** We examine a feature's most active examples, construct a narrative ("this is the honesty feature"), and assign it a label. But the feature may respond to a confound, not the concept we think.
- **Circuit interpretation.** We trace a circuit and describe it as "the indirect object identification circuit." But the same circuit might serve other functions we did not test for, and our description captures only the behavior we happened to examine.
- **Safety conclusions.** A feature labeled “deception” may actually track a correlate in the labeling set. Its silence on new inputs is not evidence of honesty until the detector has been validated on suitable positive cases, negative cases, and distribution shifts.

The consequence for safety is direct: **if our interpretations are unreliable, then safety claims built on those interpretations are also unreliable.** A safety audit that finds "no dangerous circuits" may simply have looked at the wrong features.

## Limitation 2: Non-Identifiability

Even when our interpretations are plausible, they may not be unique. Multiple circuits can replicate the same behavior. Multiple interpretations can explain the same circuit.

Consider a concrete case. Two mechanistic explanations for a model's behavior might both pass the same evaluation because each proposed circuit, when isolated, replicates the relevant input-output behavior. A test that asks only whether a circuit reproduces the behavior cannot distinguish between them.

This means:

- A safety analysis might identify one circuit for a behavior while missing an alternative circuit that also implements it.
- A claim that "we understand how the model produces this output" might be true for one circuit but miss other computational pathways that produce the same output in different contexts.
- Two researchers analyzing the same model might arrive at different mechanistic explanations, both empirically validated, with no principled way to determine which is correct.{% sidenote "Non-identifiability is not unique to MI. In statistical modeling, multiple parameter settings can produce identical predictions. In neuroscience, multiple neural circuits can implement the same cognitive function. The challenge is that MI has inherited the problem without yet developing the tools to manage it, tools like Bayesian model comparison or structural constraints that help resolve non-identifiability in other fields." %}

For safety, non-identifiability means that validating one circuit does not establish that all relevant pathways have been found. A negative claim such as “there is no dangerous mechanism” requires much broader evidence than finding no match for one hypothesized circuit.

## Limitation 3: SAEs Discard Safety-Relevant Information

The [deception detection](/topics/deception-detection/) article presented a concrete warning: a sparsity objective can discard information that matters to a safety classifier, even when the resulting features appear interpretable.

Linear probes on raw residual stream activations detect deception with greater than 99% AUROC. SAE-based probes perform significantly worse. The reconstruction step, encoding activations into sparse features and decoding them back, loses precisely the information most relevant to detecting strategic behavior.

The experiment does not show that every SAE architecture will fail. It does reveal a possible tension between two objectives:

- **Interpretability** requires compact, sparse representations that humans can understand.
- **Safety monitoring** requires preserving all information relevant to detecting dangerous behavior, even if that information is distributed and subtle.

A particular sparsity–reconstruction tradeoff can favor the first objective at the expense of the second. Whether that happens must be measured with downstream tests on held-out data.

This limitation applies beyond deception detection. Any safety-relevant property that is encoded as a distributed, non-sparse pattern in activations, rather than as a clean, localizable feature, may be invisible to SAE-based analysis. And we have no guarantee that safety-relevant properties are sparse.

## Limitation 4: Scalability

Many detailed, independently reproducible circuit results come from small or medium models. Larger-model studies now exist, but cost, access, graph size, and validation remain substantial obstacles.{% sidenote "Scaling creates both quantitative and qualitative questions. A method may become too expensive, or the model may distribute a behavior differently. Neither outcome should be assumed in advance; transfer from a smaller model needs to be tested." %}

- **SAE training at frontier scale** is computationally expensive and may require compromises such as lower-rank encoders, less training data, or a subset of layers. Each compromise can affect the resulting decomposition and needs its own evaluation.
- **Circuit tracing on full-scale models** produces enormous attribution graphs that are difficult for humans to interpret. When a single prompt generates a graph with thousands of features and tens of thousands of edges, the "interpretability" of the result is questionable.
- **The evaluation gap compounds at scale.** Verifying that an interpretation is correct becomes harder as models grow, because the space of alternative explanations grows and the cost of exhaustive testing increases.

Several especially detailed results, including the IOI circuit and early superposition studies, come from models far smaller than many deployed systems. Larger-model work has narrowed this gap, but detailed validation remains much harder at deployment scale.

## Limitation 5: Per-Input vs. Global Understanding

Many MI methods produce local or distribution-bound evidence, whereas some safety claims demand much broader coverage.

This distinction is critical. An [activation patching](/topics/activation-patching/) experiment tells us what mattered for *this specific prompt*. An attribution graph shows the reasoning for *this particular input*. A probe classification tells us the model's state on *this individual query*.

None of these extend to global claims:

- An MI analysis of 1,000 inputs does not guarantee safety on input 1,001.
- A model could pass every MI audit on tested inputs and still behave dangerously on an untested one.
- Aggregating per-input analyses to find universal mechanisms remains an unsolved problem.

No finite test set proves a universal claim such as “this model never does X.” Larger and better-targeted samples can still improve confidence and estimate risk. Formal guarantees require different tools, while many practical safety decisions will continue to combine probabilistic evidence from tests, monitors, red teams, and system-level controls.

<details class="pause-and-think">
<summary>Pause and think: What would global guarantees require?</summary>

Suppose the desired claim is universal: “this model cannot produce a prohibited class of output.” A test over 10,000 prompts cannot prove it. What additional assumptions or methods would be needed?

One possibility: formal verification of model properties, analogous to mathematical proofs about software. Instead of testing inputs, prove that no input can trigger the dangerous behavior. This is the "microscope AI" aspiration, understanding models completely enough to make guaranteed claims. The challenge is that current formal verification methods apply to much simpler programs than neural networks, and scaling them to transformer architectures is an open research problem.

</details>

## Limitation 6: The Dual-Use Problem

Many MI tools are dual-use because a mechanism that can be measured or steered may also be bypassed or pushed in an unsafe direction.

- **Refusal direction:** Understanding how refusal works enables removing it. The same paper that explained refusal also showed how to permanently bypass it with weight orthogonalization.
- **Backdoor detectors:** Understanding what probes look for helps adversaries train backdoors that evade detection. The detection method reveals the feature space the attacker must avoid.
- **Steering vectors:** The same directions that can steer models toward safety can steer them toward harm. A "helpfulness" direction applied negatively becomes an "unhelpfulness" direction.
- **Circuit understanding:** Knowing how a safety circuit works reveals how to disable it. Understanding is always bidirectional.

This dual-use property is common in security research. Vulnerability disclosures help both defenders and attackers. The difference in AI safety is the potential scale of impact: a vulnerability in a model serving billions of queries affects a correspondingly larger population.

## The Gap

Stepping back, the distance between what MI currently provides and what AI safety requires comes into focus:

**Stronger assurance may require:**

- Reliable detection of dangerous cognition across *all* inputs and model sizes
- Calibrated probabilistic estimates, and formal guarantees where the property and system permit them
- Real-time monitoring at deployment scale
- Robustness against adversarial evasion

**What MI provides:**

- Promising results in specific, controlled settings
- Results that may not generalize beyond the tested conditions
- Per-input analysis that does not scale to monitoring all requests
- Tools that can be turned against the defenses they enable

This gap does not make MI useless for safety. Defection probes, causal refusal interventions, and attribution graphs each provide evidence unavailable from ordinary output inspection. The important discipline is to match every claim to its scope and combine MI with methods that cover different failure modes.

<details class="pause-and-think">
<summary>Pause and think: Neither dismissal nor overselling</summary>

Having read through these six limitations, where do you land? Is MI a promising safety tool with solvable limitations, or is the gap between current capabilities and safety requirements too large to bridge in time?

Consider what "in time" means. Some of these problems may be tractable eventually, but safety decisions must be made while both models and interpretability methods are still changing. The practical question is whether evidence from MI will become reliable enough for the decisions that need to be made at each stage.

</details>

## A Layered Role for MI

MI has produced useful safety-relevant results:

- Near-perfect detection of trained backdoors
- Reliable identification of linear safety directions across model families
- Successful detection of alignment faking through internal probes
- Per-input circuit tracing that reveals model reasoning

And MI faces genuine, unsolved limitations:

- Interpretability illusions undermine confidence in interpretations
- Non-identifiability means we may miss alternative explanations
- Some SAE decompositions discard safety-relevant information
- Current methods may not scale to frontier models
- Per-input analysis cannot provide global guarantees
- Dual-use is inherent to understanding

MI can serve as one layer in a broader safety strategy. Behavioral evaluations sample a wide range of outputs, validated probes target known internal signals, attribution graphs support selected case studies, and formal methods can address narrowly specified properties where they apply. The combination is stronger only when the methods' assumptions and failures are understood; multiple correlated weak signals do not automatically add up to assurance.

Closing these gaps will require better decompositions, stronger validation, and more scalable methods. All three remain active areas of investigation {% cite "sharkey2025openproblems" %}.
