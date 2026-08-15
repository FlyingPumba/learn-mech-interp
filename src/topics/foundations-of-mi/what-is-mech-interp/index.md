---
title: "What is Interpretability?"
description: "What mechanistic interpretability tries to explain, how it differs from other interpretability work, and what counts as evidence for a mechanism."
order: 1
prerequisites:
  - title: "The Attention Mechanism"
    url: "/topics/attention-mechanism/"

glossary:
  - term: "Mechanistic Interpretability"
    definition: "A subfield of AI safety research focused on reverse-engineering the internal computations of neural networks to understand how they process information and produce outputs, moving beyond behavioral analysis to study the mechanisms themselves."
---

## Why Study Neural Network Internals?

Deep learning models are powerful but opaque. A language model can write fluent text, answer complex questions, and reason through multi-step problems. But *how* does it do this? What algorithms has it learned? If we deploy these systems in high-stakes settings, we face an uncomfortable question: can we trust behavior we do not understand?

Behavioral testing can catch known failure modes, but a finite test suite cannot cover every future input. Looking inside a model offers a complementary source of evidence: not a guarantee of safety, but a chance to discover computations that behavioral tests did not elicit.

This is the motivation for interpretability: making neural networks understandable to humans. And within interpretability, a specific subfield has emerged that takes this goal to its most ambitious form. Rather than treating models as black boxes whose outputs we can only observe, **mechanistic interpretability** aims to reverse-engineer them into human-understandable algorithms by analyzing the computations performed by individual components and their interactions {% cite "bereska2024review" %}.

## A Brief History: From Vision to Language

Before language models dominated AI research, interpretability work focused on image classifiers. Around 2015, researchers developed techniques to visualize what individual neurons in convolutional neural networks were detecting.

**Deep Dream** was an early demonstration of activation maximization. Take an image classifier trained on a dataset such as ImageNet, feed it an image, choose a neuron or channel, and modify the image to increase that unit's activation. Repeating the process produces surreal patterns that reveal what kinds of visual structure excite the unit. Those images are useful clues, but they are optimized examples rather than complete definitions of what the unit detects.

Chris Olah and collaborators took this further, documenting circuits in vision models {% cite "olah2020zoom" %}. They found a "car neuron" that fired when a "window neuron" activated at the top of an image, a "wheel neuron" activated at the bottom, and a "car body neuron" activated in the middle. This was not just detecting features in isolation. The model had learned compositional structure: wheels plus windows plus body equals car. These early discoveries suggested that neural networks might be more interpretable than their black-box reputation implied.

<figure>
  <img src="images/car-detector-circuit.png" alt="A circuit diagram from InceptionV1 showing how a car detector neuron is assembled from earlier feature detectors. Window features excite the car detector at the top and inhibit at the bottom, car body features excite especially at the bottom, and wheel features excite at the bottom and inhibit at the top. These spatial activation patterns combine to form the car detector.">
  <figcaption>A car detector circuit in InceptionV1. Window, car body, and wheel features each contribute spatially selective excitation and inhibition patterns that compose into a single car detector. This is the circuits claim in action: interpretable features connect through weights to implement recognizable computations. From Olah et al., <em>Zoom In: An Introduction to Circuits</em>. {%- cite "olah2020zoom" -%}</figcaption>
</figure>

Some neurons did not have clean interpretations. One neuron might fire for both wolves and Coca-Cola cans, perhaps because those concepts rarely appeared together and could share capacity without much interference. That reuse may help the model while misleading the interpreter: a label inferred only from wolf images can be accurate but incomplete.{% sidenote "If a supposed 'wolf neuron' is tested only on wolf images, its response looks persuasive. Testing a wider distribution may reveal that cans activate it too. The recurring lesson is to search for counterexamples to a neuron label, not only examples that confirm it." %}

When researchers applied these techniques to language models, the same patterns emerged. Some components had clean interpretations. Many did not. The challenge of polysemantic neurons (neurons that respond to multiple unrelated concepts) became one of the central problems of the field. We will return to this problem throughout the course.

Anthropic's “A Mathematical Framework for Transformer Circuits” adapted circuit-style analysis to transformers {% cite "elhage2021mathematical" %}. It developed the residual-stream and path-decomposition views and introduced early evidence about [induction heads](/topics/induction-heads/), which we study later. Discrete tokens required different tools from continuous pixels, but the working method transferred: identify components, trace their interactions, and test the proposed computation.

## The Interpretability Landscape

Interpretability methods vary along several axes. Understanding where mechanistic interpretability sits in this landscape clarifies what it is and what it is not.

**Black-box vs. white-box methods.** Black-box methods analyze a model by observing its inputs and outputs without looking inside. You probe behavior with curated datasets, measure feature attributions to determine which input tokens matter, and test counterfactual inputs to see how outputs change. The model is treated as a function $f: X \to Y$. White-box methods take the opposite approach: open the model and analyze its internal computations. Examine weight matrices, trace information flow through components, and identify internal algorithms. The model is treated as a mechanism to be reverse-engineered.{% sidenote "Black-box interpretability has produced valuable tools like LIME and SHAP, which assign importance scores to input features. These methods are model-agnostic and widely used. But they cannot explain *how* the model arrives at its answer, only *which inputs* contributed to it. Mechanistic interpretability asks the deeper question: what algorithm connects those inputs to the output?" %}

**Post-hoc vs. intrinsic interpretability.** Post-hoc interpretability analyzes a model after training. The model was not designed to be interpretable; we apply tools after the fact to understand what it learned. Intrinsic interpretability takes the opposite approach: build models that are interpretable by design, constraining the architecture or training procedure to produce understandable components. This trades off some performance for transparency. Mechanistic interpretability is primarily post-hoc: we take existing trained models and open them up.

**Correlation vs. causation.** This distinction runs through the entire field and will reappear in later articles. Observational methods tell us what information *exists* in a model's representations. Causal methods tell us what information the model actually *uses*. A probe trained on layer 6 activations might decode part-of-speech with 95% accuracy, but does the model *use* part-of-speech information at layer 6? Not necessarily. The information could be present but ignored by downstream computation. Distinguishing what is encoded from what is causally relevant is one of the central challenges of interpretability.{% sidenote "The correlation-causation distinction becomes concrete in later articles on probing classifiers and activation patching. Probing is observational: it detects what information is encoded. Activation patching is causal: it tests whether a component is necessary for a specific behavior. The gap between the two is often surprising." %}

> **Mechanistic Interpretability:** The subfield of AI interpretability that aims to reverse-engineer neural networks into human-understandable algorithms by analyzing the computations performed by individual components and their interactions. MI is white-box (we look inside the model), post-hoc (applied to trained models), and aims for causal understanding (not just correlation).

The goal is not just to describe *what* the model does, but to explain *how* it does it at the level of concrete mechanisms. When a language model predicts that "The Eiffel Tower is located in the city of ..." should be completed with "Paris," MI asks: which attention heads contributed to this prediction? What information did they move, and from where? What role did the MLPs play? Can we trace a specific circuit through the model that implements this factual recall?

## The Three Claims: Features, Circuits, Universality

In "Zoom In: An Introduction to Circuits," Olah et al. proposed three deliberately speculative claims about the understandability of neural networks {% cite "olah2020zoom" %}. These claims are not proven laws. They are a framework, a bet on how neural networks organize their computations. The value lies in the framework itself: even if some claims need revision, they give us a concrete vocabulary and a research program.

The authors draw an analogy to cell theory in biology. In 1839, Theodor Schwann proposed three claims about cells: all living organisms are composed of cells, the cell is the basic unit of life, and cells arise from spontaneous generation. Two of these survived. The third (spontaneous generation) was wrong. But the *framework* of cell theory transformed biology into a science. Olah et al. propose an analogous framework for neural networks, with the same epistemic humility: some claims may not fully hold, and that is fine. The framework is what matters.

### Claim 1: Features

> **Feature (linear view):** A direction in activation space associated with a property useful to the model. This is a productive hypothesis about neural-network representations, not a guarantee that every useful property is one-dimensional or easy to name.

Not individual neurons, but *directions*, vectors in the high-dimensional activation space. A feature corresponds to a direction $\mathbf{d}_f \in \mathbb{R}^{d_{\text{model}}}$. To measure how strongly feature $f$ is active in a residual stream state $\mathbf{r}$:

$$
\text{feature activation} = \mathbf{r} \cdot \mathbf{d}_f
$$

This is a dot product, a linear operation. The feature activation is the projection of the residual stream onto the feature direction. For a transformer, this might be a direction in the residual stream that activates strongly when the model processes mentions of Paris, or a direction that encodes the concept of "this token is the subject of the sentence."

Why directions rather than neurons? Individual neurons can be **polysemantic**, responding to several apparently unrelated patterns. A direction can combine several neuron coordinates, making it a more flexible candidate unit of analysis, though not automatically a uniquely correct one.

### Claim 2: Circuits

> **Circuit:** A proposed computational subgraph of a neural network: selected components or features connected by paths through the model. A strong circuit account explains a defined behavior and survives causal and distributional tests.

Features do not exist in isolation. They can influence one another through attention, MLPs, and the residual stream. A circuit hypothesis selects the components and paths proposed to matter for a behavior. Researchers then test whether the selected subgraph preserves enough of the behavior, whether removing its parts causes the predicted changes, and whether omitted components still matter. Redundancy and self-repair mean these tests rarely produce an all-or-nothing “critical path.”

**The Path Decomposition View.** Skip connections let us expand a transformer's computation into many paths. At each layer, information can pass through attention or an MLP, or continue along the residual stream. The number of formal paths grows exponentially with depth. A circuit analysis searches for a smaller set whose interventions preserve and disrupt a selected behavior in the expected ways; those tests determine how confidently we can say the model relies on it.{% sidenote "In a one-layer attention-only transformer, the direct path maps the current token embedding to logits without moving information between positions, while paths through attention can incorporate earlier tokens. This makes attention necessary for context-dependent effects in that architecture, though a full model also includes positional and MLP pathways." %}

**Concrete Example: Skip Trigrams.** Consider the phrase "keep ... in mind." If you have seen "keep" earlier in the context, and now you see "in", predicting "mind" is a good guess. This is a skip trigram: two words that predict a third, even with garbage in between. Some attention heads learn to implement this pattern. The key (in the query-key sense) for "keep" broadcasts "I form trigrams with in→mind and at→bay." When "in" appears later, its query asks "does anyone form a trigram with me?" The attention matches, and "mind" gets boosted.

But there is a bug. The head that stores "keep triggers mind" cannot know what comes after "keep" because of causal masking. So it stores *all* possible completions: "keep...in→mind" and "keep...at→bay." If you write "keep ... at mind," the model might predict "bay" because the QK circuit matched "at" to "keep" while the OV circuit retrieved the wrong completion. These skip trigram bugs are a consequence of the QK and OV circuits being separate mechanisms that cannot condition on each other within a single layer.{% sidenote "Understanding why skip trigram bugs occur is a good test of whether you understand the attention mechanism. The query-key circuit decides *where* to attend. The value-output circuit decides *what* information to move. These are independent computations within a layer. Conditional logic (if X then Y) requires spreading the computation across multiple layers." %}

**Concrete Example: Induction Heads.** A more sophisticated circuit spans two layers. In layer 0, a "previous token head" makes every position attend to the position directly behind it, copying that token's identity into its own residual stream. In layer 1, an "induction head" asks "who comes after the token that matches my current token?" The layer-0 copying enables layer-1 matching.

The result: if you see "...Barack Obama...Barack", the model predicts "Obama." This works even for random tokens that never appeared in training. The model learns a general pattern-completion algorithm, not specific facts. This is the [induction head circuit](/topics/induction-heads/), discovered by Elhage et al. {% cite "elhage2021mathematical" %}, and we will study it in detail later.

**Circuits as the Unit of Understanding.** The circuit view suggests that individual heads are not the right unit of analysis. A head in isolation might seem to do nothing interpretable. But in composition with other heads, it implements a specific algorithm. Understanding a transformer means understanding its circuits.

### Claim 3: Universality

The most speculative claim: analogous features and circuits form across different models trained on different data. If universality holds, there is a shared vocabulary of computational motifs. Similar attention patterns and feature directions appear in GPT-2, GPT-3, and other transformer models.{% sidenote "Evidence for universality remains limited and mixed. Induction heads, a specific two-head circuit pattern for in-context learning, appear across models of very different sizes. Similar previous-token heads appear in many models. But whether universality extends to complex circuits and high-level features is an open question. The claim is best treated as a productive hypothesis rather than an established fact." %}

<details class="pause-and-think">
<summary>Pause and think: Non-linear features</summary>

Can you think of a feature that might NOT be a simple direction in activation space? Consider concepts like "this sentence is a question" or "this number is larger than 100." These might require more than a single linear direction to represent. What does this suggest about the limits of the features-as-directions framework?

</details>

## The Residual Stream: Information Highway

One of the most productive conceptual shifts in MI is viewing the residual stream as the central information highway of the transformer. Rather than thinking of layers as sequential processing stages, think of the residual stream as a shared bus that all components read from and write to.

Each attention head and MLP reads from some subspace of the residual stream, computes something, and writes back to (potentially a different) subspace. The residual stream accumulates outputs: the final activation is a sum of contributions from all components. This is why we draw the architecture with the residual stream as the main spine and the attention/MLP blocks branching off to the side.

This view has several implications:

**Subspace Communication.** If a head in layer 2 wants to use information from a head in layer 1, they must share a subspace. Layer 1 writes to some directions in the residual stream; layer 2 reads from those same directions. If they use orthogonal subspaces, they cannot communicate. The model learns which subspaces to use for what purposes.{% sidenote "In high-dimensional spaces like a 768-dimensional residual stream, there is enormous room for nearly-orthogonal subspaces. Components can store different types of information without interfering, as long as they use different directions." %}

**Early Unembedding.** You can take the residual stream at any intermediate layer and apply the unembedding matrix directly. Surprisingly, you do not get nonsense. You get a rough approximation of the model's final prediction, which improves as you go deeper. The [logit lens](/topics/logit-lens-and-tuned-lens/) technique exploits this to see how the model's prediction evolves layer by layer.

**Direct Logit Attribution.** The final residual stream is a sum of component outputs, so before the final normalization we can ask how much each output aligns with a logit direction such as “Paris minus Rome.” [Direct logit attribution](/topics/direct-logit-attribution/) measures that direct contribution; causal responsibility still requires interventions and attention to downstream nonlinearities.

**Attention patterns expose routing.** Previous-token heads often show a diagonal stripe one step from the main diagonal, while induction heads can show repeated-sequence structure. These heatmaps provide hypotheses about where a head reads, but not what it writes or whether the write matters. The short article on [reading attention patterns](/topics/reading-attention-patterns/) develops that distinction.{% sidenote "Attention patterns are unusually accessible because both axes correspond to token positions. Their visual legibility is also a trap: an understandable routing pattern is not yet an understandable computation." %}

The conceptual framework is only useful if we can actually inspect models. Libraries like [TransformerLens](/topics/transformerlens/) and [nnsight](/topics/nnsight-and-nnterp/) wrap standard transformer models with hooks at every intermediate computation, letting researchers access attention patterns, read the residual stream at any layer, and intervene mid-forward-pass. Nearly all the experiments described in this course can be reproduced with a few lines of code using these tools, which we cover in detail in the [Tools block](/topics/transformerlens/).

## Why MI Matters for AI Safety

If we deploy powerful AI systems, we need to verify their behavior. Behavioral testing can catch known failure modes, but it cannot guarantee correct behavior on unseen inputs. We need a deeper form of assurance: understanding the internal mechanisms that produce the model's behavior.

If we can identify the internal mechanisms a model uses, we can check whether those mechanisms implement the behavior we want. A model that has learned a "deception" circuit producing misleading outputs when it detects certain conditions could, in principle, be identified through MI before deployment. The aspiration is to move from "the model passes our tests" to "we understand how the model works, and its mechanisms match our intentions."

This is still an active research problem. Current MI tools do not yet scale to full verification of large models. But the mathematical framework is the foundation, and rapid progress on techniques like [sparse autoencoders](/topics/sparse-autoencoders/) and circuit tracing is pushing the frontier forward. We will return to the safety applications of MI in later articles on sleeper agent detection and deception detection.

## A Young and Rapidly Evolving Field

MI has developed rapidly. Distill.pub published early circuits work on vision models in 2017-2019. Olah et al. proposed the features-circuits-universality framework in 2020. Elhage et al. developed the mathematical framework for transformer circuits in 2021, discovering induction heads in the process. The period from 2022 to 2023 brought the IOI circuit analysis, the superposition hypothesis, and early sparse autoencoders. By 2024-2025, researchers were applying attribution graphs and SAEs to frontier models like Claude 3 Sonnet.

MI is a young and rapidly changing field. Many core results date from the past few years, and today's methods may be superseded. The foundational *questions* about features, circuits, and [superposition](/topics/superposition/) are more stable than any one technique, so this course emphasizes the concepts and the evidence used to test them.

<details class="pause-and-think">
<summary>Pause and think: Understanding vs. correlation</summary>

What evidence would convince you that a model "understands" something versus merely correlating with it? This question runs through the entire field of mechanistic interpretability. Keep it in mind as we move through the coming articles on circuits, probing, and causal methods.

</details>

## Looking Ahead

We have now defined what mechanistic interpretability is and what it seeks: features as directions in activation space, circuits connecting those features through the model's weights, and potentially universal patterns recurring across models. The next article on the [linear representation hypothesis](/topics/linear-representation-hypothesis/) takes the features claim deeper, asking *why* features should be linear directions and what happens when the model has more features than dimensions.
