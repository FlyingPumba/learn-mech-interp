---
title: "Honest Limitations of MI for Safety"
description: "A candid assessment of what mechanistic interpretability cannot yet do for AI safety -- from interpretability illusions to scalability gaps -- and why closing these gaps matters."
order: 5
prerequisites:
  - title: "Safety Mechanisms and MI-Based Monitoring"
    url: "/topics/safety-mechanisms-and-monitoring/"
---

## The Honest Assessment

The preceding articles in this block presented MI's safety applications with their individual caveats. [Defection probes](/topics/sleeper-agent-detection/) detect trained backdoors but may not generalize to natural deception. [Internal probes](/topics/deception-detection/) detect alignment faking with high accuracy, but SAEs fail at this task. [Safety mechanisms](/topics/safety-mechanisms-and-monitoring/) are linearly encoded and discoverable, but also linearly bypassable.

This article steps back from individual applications to examine cross-cutting limitations that affect *all* MI-based safety approaches. These are not minor qualifications. They represent fundamental gaps between what MI currently provides and what AI safety actually requires.

Being honest about these limitations is itself important. Overstating MI's safety capabilities creates false confidence, which is worse than having no safety tools at all -- a safety tool you trust but that does not work is more dangerous than knowing you have no safety tool.{% sidenote "The false confidence problem is not hypothetical. In cybersecurity, the deployment of antivirus software that catches 90% of malware but gives users a false sense of complete protection has historically led to worse security outcomes than having no antivirus at all. Users who believe they are protected take more risks. The same dynamic could apply to AI safety: organizations that believe MI-based monitoring makes their models safe may deploy more aggressively." %}

## Limitation 1: Interpretability Illusions

The foundation of MI is that we can look at model internals and correctly understand what we see. But what if our interpretations are wrong?

Bolukbasi et al. (2021) demonstrated that plausible explanations based on top activating examples can be **completely wrong**. A neuron that activates strongly on examples containing dogs may not be a "dog detector" -- it might respond to a visual texture that correlates with dog images in the dataset. The narrative we construct from top activating examples is post-hoc rationalization, not guaranteed understanding.

This problem is pervasive in MI:

- **Feature labeling.** We examine a feature's most active examples, construct a narrative ("this is the honesty feature"), and assign it a label. But the feature may respond to a confound, not the concept we think.
- **Circuit interpretation.** We trace a circuit and describe it as "the indirect object identification circuit." But the same circuit might serve other functions we did not test for, and our description captures only the behavior we happened to examine.
- **Safety conclusions.** If we identify a "deception feature" and observe that it does not activate on some set of inputs, we might conclude the model is not being deceptive. But the feature might not actually detect deception -- it might detect a correlate that happens to coincide with deception in our test cases.

The consequence for safety is direct: **if our interpretations are unreliable, then safety claims built on those interpretations are also unreliable.** A safety audit that finds "no dangerous circuits" may simply have looked at the wrong features.

## Limitation 2: Non-Identifiability

Even when our interpretations are plausible, they may not be unique. Multiple circuits can replicate the same behavior. Multiple interpretations can explain the same circuit.

Consider a concrete case. Two different mechanistic explanations for a model's behavior on a task might both pass standard evaluation: each proposed circuit, when isolated, replicates the model's input-output behavior. Standard evaluation methods -- "does the circuit replicate behavior?" -- cannot distinguish between them.

This means:

- A safety analysis might identify one circuit for a behavior while missing an alternative circuit that also implements it.
- A claim that "we understand how the model produces this output" might be true for one circuit but miss other computational pathways that produce the same output in different contexts.
- Two researchers analyzing the same model might arrive at different mechanistic explanations, both empirically validated, with no principled way to determine which is correct.{% sidenote "Non-identifiability is not unique to MI. In statistical modeling, multiple parameter settings can produce identical predictions. In neuroscience, multiple neural circuits can implement the same cognitive function. The challenge is that MI has inherited the problem without yet developing the tools to manage it -- tools like Bayesian model comparison or structural constraints that help resolve non-identifiability in other fields." %}

For safety, non-identifiability means **we cannot be confident we have found all relevant circuits.** A safety analysis that finds "no dangerous circuits" may have found one explanation while missing others.

## Limitation 3: SAEs Discard Safety-Relevant Information

The [deception detection](/topics/deception-detection/) article presented this finding in context. Here we state it as a general limitation: the sparsity objective that makes SAEs useful for interpretability may systematically discard information that matters for safety.

Linear probes on raw residual stream activations detect deception with greater than 99% AUROC. SAE-based probes perform significantly worse. The reconstruction step -- encoding activations into sparse features and decoding them back -- loses precisely the information most relevant to detecting strategic behavior.

This is not a failure of a specific SAE architecture. It reflects a tension between two objectives:

- **Interpretability** requires compact, sparse representations that humans can understand.
- **Safety monitoring** requires preserving all information relevant to detecting dangerous behavior, even if that information is distributed and subtle.

The sparsity constraint optimizes for the first objective at the expense of the second. Features that are individually interpretable may collectively miss distributed patterns that only emerge in the raw, high-dimensional activation space.

This limitation applies beyond deception detection. Any safety-relevant property that is encoded as a distributed, non-sparse pattern in activations -- rather than as a clean, localizable feature -- may be invisible to SAE-based analysis. And we have no guarantee that safety-relevant properties are sparse.

## Limitation 4: Scalability

Current MI methods produce their most compelling results on small and medium models. Whether they scale to frontier models with hundreds of billions of parameters is an open question with troubling early indicators.{% sidenote "The scalability concern is not merely about computational cost, though cost is a factor. The deeper issue is qualitative: frontier models may implement computations in fundamentally different ways than small models. A technique that reveals clean circuits in GPT-2 may find only noise in GPT-4, not because the technique is wrong, but because the computational structure is different at scale." %}

- **SAE training at frontier scale** is computationally expensive and may require approximations -- lower-rank encoders, reduced training data, subsampled layers -- that sacrifice the quality of the decomposition.
- **Circuit tracing on full-scale models** produces enormous attribution graphs that are difficult for humans to interpret. When a single prompt generates a graph with thousands of features and tens of thousands of edges, the "interpretability" of the result is questionable.
- **The evaluation gap compounds at scale.** Verifying that an interpretation is correct becomes harder as models grow, because the space of alternative explanations grows and the cost of exhaustive testing increases.

The field's most impressive results -- the IOI circuit, polysemanticity in one-layer models, steering vectors in medium models -- come from models that are orders of magnitude smaller than the models being deployed in practice. The gap between demonstration and deployment is large.

## Limitation 5: Per-Input vs. Global Understanding

MI gives us per-input explanations. Safety requires global guarantees.

This distinction is critical. An [activation patching](/topics/activation-patching/) experiment tells us what mattered for *this specific prompt*. An attribution graph shows the reasoning for *this particular input*. A probe classification tells us the model's state on *this individual query*.

None of these extend to global claims:

- An MI analysis of 1,000 inputs does not guarantee safety on input 1,001.
- A model could pass every MI audit on tested inputs and still behave dangerously on an untested one.
- Aggregating per-input analyses to find universal mechanisms remains an unsolved problem.

The gap between local and global understanding is not a minor technical challenge. It is a fundamental limitation of the current MI paradigm. Safety requires statements of the form "this model never does X." MI provides statements of the form "this model did not do X on these inputs." The logical gap between them cannot be closed by testing more inputs -- it requires a different kind of analysis entirely.

<details class="pause-and-think">
<summary>Pause and think: What would global guarantees require?</summary>

Safety requires claims like "this model cannot produce bioweapons instructions." MI currently supports claims like "this model did not produce bioweapons instructions on these 10,000 test prompts." What methodological advance would bridge this gap?

One possibility: formal verification of model properties, analogous to mathematical proofs about software. Instead of testing inputs, prove that no input can trigger the dangerous behavior. This is the "microscope AI" aspiration -- understanding models completely enough to make guaranteed claims. The challenge is that current formal verification methods apply to much simpler programs than neural networks, and scaling them to transformer architectures is an open research problem.

</details>

## Limitation 6: The Dual-Use Problem

Every MI tool for safety is simultaneously a tool for attack. This is not a bug in MI -- it is inherent to the enterprise of understanding systems.

- **Refusal direction:** Understanding how refusal works enables removing it. The same paper that explained refusal also showed how to permanently bypass it with weight orthogonalization.
- **Backdoor detectors:** Understanding what probes look for helps adversaries train backdoors that evade detection. The detection method reveals the feature space the attacker must avoid.
- **Steering vectors:** The same directions that can steer models toward safety can steer them toward harm. A "helpfulness" direction applied negatively becomes an "unhelpfulness" direction.
- **Circuit understanding:** Knowing how a safety circuit works reveals how to disable it. Understanding is always bidirectional.

This dual-use property is common in security research. Vulnerability disclosures help both defenders and attackers. The difference in AI safety is the potential scale of impact: a vulnerability in a model serving billions of queries affects a correspondingly larger population.

## The Gap

Stepping back, the distance between what MI currently provides and what AI safety requires comes into focus:

**What safety requires:**

- Reliable detection of dangerous cognition across *all* inputs and model sizes
- Guarantees, not probabilistic estimates
- Real-time monitoring at deployment scale
- Robustness against adversarial evasion

**What MI provides:**

- Promising results in specific, controlled settings
- Results that may not generalize beyond the tested conditions
- Per-input analysis that does not scale to monitoring all requests
- Tools that can be turned against the defenses they enable

This gap does not mean MI is useless for safety. The defection probe result is real. Linear safety directions are real. Attribution graphs provide genuine insight into model reasoning. But the distance between these demonstrations and the safety assurance the world needs is substantial, and closing it requires advances that go beyond incremental improvements to existing methods.{% sidenote "Three perspectives on the gap: The optimist (Dario Amodei): 'We are building an MRI for AI. Give us 5-10 more years.' The pragmatist (Neel Nanda): 'Full reverse-engineering is probably dead, but partial understanding helps.' The critic (Dan Hendrycks): 'Returns from interpretability have been roughly nonexistent.' Each captures a real aspect of the situation. The field is making progress, but the progress is slower than the pace of model capability advancement." %}

<details class="pause-and-think">
<summary>Pause and think: Neither dismissal nor overselling</summary>

Having read through these six limitations, where do you land? Is MI a promising safety tool with solvable limitations, or is the gap between current capabilities and safety requirements too large to bridge in time?

Consider what "in time" means. The question is not whether MI will eventually solve these problems -- given enough time, many seem solvable. The question is whether MI will solve them before AI capabilities advance to the point where safety assurance is critically needed. This is a race between understanding and capability, and the answer depends on the relative pace of both.

</details>

## Closing the Gap

The honest assessment is neither dismissal nor overselling. MI has produced genuine safety-relevant results:

- Near-perfect detection of trained backdoors
- Reliable identification of linear safety directions across model families
- Successful detection of alignment faking through internal probes
- Per-input circuit tracing that reveals model reasoning

And MI faces genuine, unsolved limitations:

- Interpretability illusions undermine confidence in interpretations
- Non-identifiability means we may miss alternative explanations
- SAEs discard safety-relevant information
- Current methods may not scale to frontier models
- Per-input analysis cannot provide global guarantees
- Dual-use is inherent to understanding

The path forward likely involves MI as one layer in a multi-layered safety strategy -- what some researchers call the "Swiss cheese model" of AI safety. No single approach closes all the gaps, but each approach covers holes that others leave open. Behavioral evaluations provide broad coverage. MI probes detect known internal threats. Attribution graphs audit high-stakes decisions. Formal methods may eventually provide guarantees. The combination may be sufficient even if no individual approach is.

For the open research problems that must be solved to close these gaps, see [open problems in MI methods](/topics/open-problems-methods/).
