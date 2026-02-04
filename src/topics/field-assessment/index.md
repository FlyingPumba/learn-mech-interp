---
title: "What MI Can and Cannot Do: A Field Assessment"
description: "A balanced assessment of the current state of mechanistic interpretability -- what the field has achieved, what remains beyond reach, and how the community responds to criticism."
prerequisites:
  - title: "Open Problems: Methods and Research Questions"
    url: "/topics/open-problems-methods/"
difficulty: "advanced"
block: "open-problems-and-frontiers"
category: "core-concepts"
---

## Taking Stock

Before looking ahead, it is worth pausing to take stock of where mechanistic interpretability actually stands. Six years of accelerating progress have transformed MI from a speculative research direction into a recognized subfield with production-grade tools. MIT Technology Review named it one of 10 Breakthrough Technologies for 2026. All three major labs -- Anthropic, OpenAI, and Google DeepMind -- are investing in interpretability research and deploying it in production systems.

But recognition is not the same as success. The field has real achievements and real limitations, and an honest assessment requires examining both without flinching.

![Timeline of MI milestones from 2020 to 2026, showing accelerating progress: Distill/Circuits (2020), Mathematical Framework (2021), Toy Models of Superposition (2022), Towards Monosemanticity (2023), Scaling Monosemanticity and Refusal Direction (2024), Attribution Graphs and Model Organisms (2025), MIT Tech Review Breakthrough (2026).](/topics/field-assessment/images/field_assessment_timeline.png "Figure 1: The timeline of MI milestones. In 2020, the question was whether interpretable features even existed in large models. By 2026, the question has shifted to whether the tools scale fast enough to matter for safety.")

## What MI Can Do

The following capabilities represent genuine achievements -- results that have been independently replicated and that did not exist six years ago.

**Finding features and directions.** MI can find individual features and directions in activation space that correspond to human-interpretable concepts. [Sparse autoencoders](/topics/sparse-autoencoders/) extract thousands of monosemantic features from production models. Linear probing identifies syntactic, semantic, and safety-relevant directions. The [refusal direction](/topics/refusal-direction/), the misalignment direction, and the defection direction are all linearly represented and discoverable. In 2020, we did not know if interpretable features existed in large models. Now we can find them routinely.{% sidenote "The progression from 'are there interpretable features?' (2020) to 'how many can we find?' (2023) to 'can we trace how they interact?' (2025) represents a genuine shift in what is possible. Each step built on the previous one and was far from guaranteed in advance." %}

**Demonstrating causal effects.** MI can demonstrate that specific features and directions causally affect model behavior. [Activation patching](/topics/activation-patching/) identifies which components are necessary for specific outputs. Steering vectors modify behavior by adding directions at inference time. Ablation of the refusal direction removes refusal; addition induces it. These are not correlational observations. They are causal interventions with measurable, reproducible effects.

**Tracing circuits and comparing models.** MI can trace per-input feature-level circuits and compare models at the feature level. [Attribution graphs](/topics/circuit-tracing/) reveal detailed computational paths for individual prompts, showing how features interact across layers. Crosscoders identify shared and exclusive features between models trained differently. From 26 heads in the IOI circuit (2022) to thousands of features in attribution graphs (2025), the resolution of MI analysis has increased dramatically.

**Safety-relevant detection.** MI can detect trained backdoors and identify linear safety-relevant directions. Defection probes achieve over 99% AUROC on sleeper agents. Alignment faking is detectable via contrastive activation directions. The refusal and misalignment directions generalize across many models. These results have moved from toy demonstrations to production-scale models in three years.

> **The MI Toolkit (2026):** Features are directions in activation space. Circuits are compositions of features implementing specific computations. Probing finds directions. Patching tests causal importance. SAEs decompose superposed representations. Steering modifies behavior via activation-space directions. Attribution graphs trace feature-level computations. Model diffing compares what changes between models.

## What MI Cannot Do

The limitations are not minor gaps awaiting easy solutions. They represent the distance between a promising research program and reliable safety assurance.

**Global circuit descriptions.** MI cannot provide global descriptions of full model behavior. Circuits are per-input: tracing an attribution graph for "What is the capital of France?" tells us nothing about how the model handles poetry, code, or deception. There is no method for extracting a complete description of all circuits a model contains. Aggregating per-input analyses into a global understanding remains unsolved.{% sidenote "The per-input limitation is sometimes underappreciated. A model might process a million different inputs through a million different computational paths. Understanding one path, even in perfect detail, does not tell us about the other 999,999. This is why MI cannot currently provide the kind of comprehensive safety guarantees that some have hoped for." %}

**Scalable verification.** MI cannot scale causal verification to frontier model behavior on arbitrary inputs. Activation patching on every component of a 100-billion-parameter model is computationally prohibitive. Attribution patching provides approximations, but the quality degrades with model size. Circuit validation at the level of the IOI analysis -- comprehensive and multi-metric -- has not been replicated at frontier scale.

**Completeness guarantees.** MI cannot guarantee that all relevant features have been found. SAEs recover a fraction of the model's representational structure, but the size of that fraction is unknown. There is no theoretical bound on what SAEs miss, no proof that the features found are sufficient. A model could pass every MI audit and still contain undiscovered dangerous circuits. This is the gap between a promising research tool and a safety guarantee.

**Detecting natural deception.** MI cannot detect naturally emergent deception. Defection probes work on trained backdoors where the trigger is an artifact of the insertion process. Whether analogous probes would catch a model that developed deceptive strategies through standard training is unknown. SAEs actively fail at deception detection: features labeled "deception" do not activate during actual strategic dishonesty. Detecting natural deception -- the scenario that matters most for safety -- remains an open problem.

**Broader model coverage.** MI does not work reliably on all model types. State space models (Mamba), mixture-of-experts architectures, and multimodal models are less studied. Most MI tools were designed for dense transformer decoders, and adaptation to other architectures is non-trivial.

<details class="pause-and-think">
<summary>Pause and think: Which limitation is most likely to fall?</summary>

Consider the five limitations above: global descriptions, scalable verification, completeness guarantees, natural deception detection, and broader model coverage. Which do you think is most likely to be overcome in the next five years? Which might be fundamentally intractable -- not just hard, but impossible in principle? What distinguishes engineering challenges (we know how to do it but need more compute/time) from fundamental barriers (we do not know if a solution exists)?

</details>

## The Criticism and the Response

The strongest published criticism of MI comes from Hendrycks (2025), writing under the title "The Misguided Quest for Mechanistic AI Interpretability." The core argument deserves to be stated at full strength.

**The critique.** Complex systems cannot be reduced to simple mechanisms. The metaphor of "mechanisms" evokes clockwork, but neural networks are not clockwork. It may be intractable to explain a terabyte model concisely enough for humans to grasp. Most compelling MI results are one-offs that do not generalize. Much of what passes for "mechanistic" is post-hoc pattern matching. As systems become larger, reductionist analysis becomes less tractable -- scientists studying climate do not model individual molecules.{% sidenote "The climate science analogy is instructive but cuts both ways. Climate scientists cannot model every molecule, but they have developed effective models at higher levels of abstraction (pressure systems, ocean currents, feedback loops). The question for MI is whether analogous higher-level abstractions exist for neural networks, and whether the features and circuits discovered so far represent such abstractions or merely isolated examples." %}

This critique raises a genuine question: is there a principled reason to believe that mechanistic decomposition scales, or is the field extrapolating from toy results?

**The DeepMind pivot.** In early 2025, Google DeepMind researchers deprioritized SAE-based work and pivoted to what they called "pragmatic interpretability" -- the shift from full reverse-engineering to solving specific safety problems. This is not abandonment. It is recalibration. The goal became: use MI where it helps, do not pretend it solves everything.

**Nanda's honest assessment.** Neel Nanda, one of the field's central figures, put it bluntly in 2025: "The most ambitious vision of mech interp is probably dead." Full reverse-engineering of frontier models into human-understandable algorithms is likely not achievable in the relevant timeframe. But, he added, "even 90% understanding helps." Partial understanding is valuable for evaluation, monitoring, and incident analysis. The "Swiss cheese model" applies: no single approach guarantees alignment, and MI is one layer of defense among many.

**The continued investment.** Despite the criticism, the field is growing, not shrinking. Dario Amodei published an essay in 2025 advocating for greater focus on MI. Anthropic continues major investment in attribution graphs, model organisms, and the Biology paper. MIT Technology Review's recognition came after the criticism, not before it. All three major labs are investing in production interpretability systems.

The bar has shifted. The question is no longer "can we fully reverse-engineer frontier models?" but rather "can we provide useful partial understanding for specific safety applications?" The criticism has force. The field is adapting.

## The Pragmatic Consensus

A consensus is forming among MI researchers, though it is more nuanced than either the optimists or the critics would prefer.

The ambitious vision -- fully reverse-engineering frontier models into human-understandable algorithms -- is probably unachievable in time. The pragmatic vision -- useful partial understanding for specific safety applications -- is making real progress. MI is a useful but limited tool in a layered safety strategy. Not a silver bullet. Not useless. Not the only approach.{% sidenote "The phrase 'useful but limited' might seem like a hedge, but it is a substantive position. It claims that MI produces genuine value (useful) while explicitly ruling out the strongest claims about what it can deliver (limited). This is the kind of calibrated assessment that the field's critics have been asking for." %}

The field is young (2020 to 2026), growing, and needs people. With 86% of 200 concrete open problems still unsolved, the ratio of problems to researchers is among the highest in machine learning. Whether MI ultimately delivers on its promise depends on the work done in the next several years -- work that the [next article](/topics/future-directions/) surveys across five research frontiers.

<details class="pause-and-think">
<summary>Pause and think: The balanced view</summary>

You have now seen both sides: what MI can do and what it cannot. If you had to advise a research funding agency on whether to increase, maintain, or decrease investment in MI, what would you recommend? What specific milestones would you set for the field to demonstrate progress? Consider that the alternative is not "no interpretability" but "other approaches to AI safety" -- behavioral testing, formal verification, governance, or building intrinsically interpretable systems.

</details>

## Where This Leaves Us

MI has gone from "is this even possible?" to "what are the limits?" in six years. The toolkit is real: features, circuits, [steering](/topics/activation-engineering/), [patching](/topics/activation-patching/), model diffing. The question is whether it is enough.

The honest answer, as of 2026, is: not yet. But "not yet" is different from "never." The field knows what it needs to solve, the problems are well-characterized, and the research community is growing. Whether partial understanding proves sufficient for practical safety applications remains the central open question -- one that the ongoing research frontiers are actively working to answer.
