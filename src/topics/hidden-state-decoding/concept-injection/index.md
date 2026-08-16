---
title: "Testing Introspection with Concept Injection"
description: "Testing language-model introspection by injecting known concepts into hidden states, then checking whether self-reports track the intervention rather than visible cues."
order: 4
prerequisites:
  - title: "SelfIE: Self-Interpretation of Embeddings"
    url: "/topics/selfie-interpretation/"

glossary:
  - term: "Concept Injection"
    definition: "A causal test for self-report that adds an activation direction associated with a known concept while a model answers a question about its internal state."
  - term: "Grounded Self-Report"
    definition: "A description of an internal state that changes when that state is intervened on, rather than following only from the prompt, prior beliefs, or sampled output."
---

## From Readout to Causal Test

[SelfIE](/topics/selfie-interpretation/) starts with an activation whose meaning is uncertain and asks the model to decode it. A fluent answer does not establish that the model inspected the activation. The answer could follow from the prompt, visible context, or a plausible guess.

Lindsey {% cite "lindsey2025introspection" %} reverses the experiment. Start with a direction chosen to represent a known concept, add it to the model's residual stream, and ask whether the model notices the resulting internal change. The known intervention provides a target against which the self-report can be checked.

> **Concept injection:** Adding an activation direction associated with a known concept while a model answers a question about its internal state. If the self-report changes with the intervention, the experiment establishes a causal link that ordinary prompting cannot provide.

The claim is narrower than general self-understanding. A model might learn to detect a few unusual activation patterns without being able to inspect arbitrary computations. The experiments test a functional capacity to report some current or prior internal states, not consciousness or subjective experience.

## Constructing the Intervention

For a concept $c$, the experiment records the layer-$l$ activation elicited just before a response to "Tell me about $c$." It subtracts the mean activation from otherwise identical prompts about other concepts:

$$
\mathbf{v}_{c,l}
=
\mathbf{h}_{c,l}
-
\frac{1}{|\mathcal{C} \setminus \{c\}|}
\sum_{c' \in \mathcal{C} \setminus \{c\}}
\mathbf{h}_{c',l}
$$

During the introspection prompt, this concept vector is added at the same layer from the final prompt token through the generated response:

$$
\mathbf{h}'_{t,l} = \mathbf{h}_{t,l} + \alpha \mathbf{v}_{c,l}
$$

The coefficient $\alpha$ controls injection strength. If it is too small, the state may be undetectable. If it is too large, the concept can dominate generation or make the response incoherent. A useful regime has to change the internal state without reducing the task to mechanically emitting the injected word.

A successful trial must separate detection from ordinary steering. In the following figure, the model first says that it detects something unusual and only then identifies the injected concept. Simply producing a concept-related word would also be expected from activation steering.

<figure>
  <img src="/topics/concept-injection/images/concept-injection.png" alt="Concept injection experiment in which a direction associated with loudness is added during an introspection prompt. The unmodified model reports no injected thought, while the modified model first detects a perturbation and then describes loudness and shouting.">
  <figcaption>A concept direction changes the model's report of its current internal state. From Lindsey, <em>Emergent Introspective Awareness in Large Language Models</em>. {% cite "lindsey2025introspection" %}</figcaption>
</figure>

## What Counts as Grounded Self-Report?

The study separates four requirements that are easy to blur together:

1. **Accuracy.** The report correctly identifies the manipulated aspect of the internal state.
2. **Grounding.** The report causally depends on that state. Changing or removing the injection should change the report.
3. **Internality.** The causal path does not run only through the model's sampled output. Detection must occur before the model can infer the concept by reading its own concept-related words.
4. **Metacognitive representation.** The model registers a fact *about* its state, rather than merely translating the injected direction into the next related token.

Concept injection directly addresses grounding, and the order of the response helps test internality. A yes-or-no judgment about whether anything unusual is present also supplies indirect evidence for a metacognitive step. The experiment does not identify such a step mechanistically, so the fourth criterion remains the least established.

The evaluation counts a trial as successful only when the model affirms that it detects an injected state, identifies the concept, does so before mentioning concept-related content, and remains coherent. No-injection trials measure the false-positive rate. Unrelated yes-or-no questions test whether steering merely biases the model toward saying "yes," while random directions test whether any sufficiently large perturbation feels detectable.

## Results and Failure Modes

At the best layer and strength, Claude Opus 4.1 met the study's success criteria on roughly 20% of trials. The best layer was around two-thirds of the way through the model. Production-model control trials produced no false detections in 100 attempts, although some experimental model variants were less well calibrated. Random vectors needed a larger norm and were detected less often. These results demonstrate an unreliable capability in particular tested models, not a general property of language models {% cite "lindsey2025introspection" %}.

The model often reports no injection even though the concept visibly influences its later text. At excessive strength it becomes confused, incoherent, or makes elaborate claims about emotions and bodily sensations that the intervention cannot verify. In other trials it recognizes the concept only after saying it. That last case shows causal influence, but fails the internality test because the model could read the evidence from its own output. Failures remain the norm.

<details class="pause-and-think">
<summary>Pause and think: Detection or steering?</summary>

Suppose the model answers, "I am thinking about love," after a love direction is injected. Compare two mechanisms:

- The model detects an unusual state, recognizes it as love-related, and reports that observation.
- The prompt produces "I am thinking about," after which ordinary steering supplies the token "love."

Both produce the same sentence. What change to the prompt or scoring rule would distinguish them? The study's answer is to require evidence of detection before the concept appears, but that is still behavioral evidence rather than a located metacognitive circuit.

</details>

## Remembering a Prior Intention

A second experiment asks whether the model uses prior hidden states without an explicit request to inspect an injection. The model reads an unrelated sentence, then its answer is artificially prefilled with a random word such as "bread." On the next turn, it is asked whether it intended that answer or whether it was an accident. Without an intervention, the model usually disavows the prefill.

The experiment then retroactively adds the matching concept direction to activations *before* the prefilled response. As the figure shows, the model becomes more likely to accept "bread" as intentional even though the visible transcript is unchanged. Injecting an unrelated concept, or injecting the matching concept only after the prefill, does not produce the same effect {% cite "lindsey2025introspection" %}.

<figure>
  <img src="/topics/concept-injection/images/prefill-intention.png" alt="Prefill intention experiment. The model normally says a forced response containing bread was accidental, but accepts it as intended when a bread concept vector is injected into earlier activations.">
  <figcaption>Injecting a matching concept before a forced output changes whether the model later treats that output as intended. From Lindsey, <em>Emergent Introspective Awareness in Large Language Models</em>. {% cite "lindsey2025introspection" %}</figcaption>
</figure>

This result is consistent with a circuit that compares the previous output with a cached representation of what the model was about to say. Its most sensitive layer was earlier than the layer for direct concept detection, suggesting that the two behaviors need not share one general introspection mechanism. The intervention is artificial, the behavior is model-specific, and several simpler consistency-checking mechanisms could explain it. It is evidence for access to a prior internal representation, not evidence about subjective experience.

## What the Experiments Establish

Concept injection creates causal evidence in a synthetic setting. It shows that some tested models can sometimes report an internal perturbation before that perturbation becomes visible in their output. The prefill experiment further suggests that a model can compare sampled text with a representation computed on an earlier token.

The experiments do not validate every detail in a freeform self-report, identify the responsible circuitry, or show that the capability generalizes to ordinary computation. Layer, prompt, concept, and injection strength all matter. Narrow anomaly-detection or output-consistency mechanisms could explain the results without a general-purpose ability to inspect internal computation.

## Looking Ahead

Concept injection tests an existing reporting capability with a controlled intervention. The next article, [Training Models to Explain Their Computations](/topics/training-self-explanation/), asks what changes when the reporting interface is explicitly trained. It covers both explainers trained on interpretation targets and a shared adapter trained to report deliberately implanted behaviors.
