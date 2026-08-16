---
title: "Probing Classifiers"
description: "Training simple classifiers on model activations to test what they encode, while controlling for probe capacity and separating correlation from causal use."
order: 1
prerequisites:
  - title: "The Logit Lens and Tuned Lens"
    url: "/topics/logit-lens-and-tuned-lens/"

glossary:
  - term: "Linear Probe"
    definition: "A simple linear classifier trained on frozen model activations to test whether specific information (such as part of speech or sentiment) is linearly accessible at a given layer, providing evidence about what representations a model has learned."
  - term: "Probing Classifier"
    definition: "A simple model (typically linear) trained on neural network activations to predict properties of the input, used as a diagnostic tool to test what information is encoded at different layers of a network."
---

## From Predictions to Representations

The [logit lens and tuned lens](/topics/logit-lens-and-tuned-lens/) project intermediate states to vocabulary space, answering "what would the model predict at this layer?" Probing classifiers ask a different question: "what information is encoded in the representations at this layer?"

A probing classifier is a simple model, typically linear, trained to predict a linguistic or semantic property from the internal activations at a given layer:

$$
\hat{y} = \text{Probe}(\mathbf{h}_\ell) = \sigma(\mathbf{h}_\ell W_p + \mathbf{b}_p)
$$

If a linear probe achieves high accuracy, the information is *present and linearly accessible* in the representations. The probe's simplicity is deliberate: a powerful nonlinear probe might learn the property itself rather than detecting it in the representations.

> **Probing Classifier:** A probing classifier is a simple model (typically linear) trained to predict a linguistic or semantic property $y$ from the internal activations $\mathbf{h}_\ell$ of a neural network at layer $\ell$. High probe accuracy indicates the property is encoded in the representations. The probe's simplicity ensures that a successful readout reflects information in the representations, not computation performed by the probe itself.

Why restrict probes to be linear? The restriction connects to the [linear representation hypothesis](/topics/linear-representation-hypothesis/): a successful linear probe shows that the labeled distinction is accessible through one affine boundary. A nonlinear probe has more capacity and may recover real nonlinear structure, but it can also compute part of the target from incidental information. Simplicity makes the result easier to interpret, not automatically correct.{% sidenote "Comparing probe classes can still be informative. The gap between a linear and nonlinear probe should be evaluated alongside control tasks, sample complexity, and baselines rather than interpreted as a direct measure of how the model itself computes the property." %}

### Structural Probes: Beyond Labels

Hewitt and Manning (2019) pushed probing beyond simple classification by introducing structural probes {% cite "hewitt2019structural" %}. Instead of asking "is this token a noun?", they asked: "does the geometry of the representations encode the entire syntax tree?"

A structural probe finds a linear transformation $B$ under which the squared L2 distance between word representations encodes parse-tree distance:

$$
d_B(\mathbf{h}_i, \mathbf{h}_j)^2 = \left\| (\mathbf{h}_i - \mathbf{h}_j) B \right\|_2^2 \approx \text{tree\_distance}(i, j)
$$

<figure>
  <img src="images/structural_probe_parse_trees.png" alt="Gold parse trees (black arcs) compared with trees recovered by the structural probe from BERT-large layer 16 (blue), ELMo layer 1 (red), and a non-contextual baseline (purple). BERT's recovered tree closely matches the gold parse tree, while the baseline fails to capture long-range syntactic structure.">
  <figcaption>Gold parse trees (black) compared with trees recovered by the structural probe from BERT-large layer 16 (blue), ELMo layer 1 (red), and a non-contextual baseline (purple). The probe finds a linear transformation under which distances between word representations approximate parse tree distances, allowing full tree recovery. From Hewitt and Manning, <em>A Structural Probe for Finding Syntax in Word Representations</em>. {%- cite "hewitt2019structural" -%}</figcaption>
</figure>

Their results showed that syntax trees are embedded in a linear subspace of BERT representations. Different layers encode different syntactic details: earlier layers capture local structure, later layers capture longer-range dependencies. The structural probe levels off with increasing rank, indicating a lower-dimensional syntactic subspace within the full representation.

Probes can detect not just labels but *relational structure* in representations. The promise is tantalizing: we can read rich, structured information directly from how the model represents language internally.

## Sparse Probing: Constraining What the Probe Can Access

Standard linear probes use all neurons in a layer. But if we want to understand *how* information is organized, a more revealing question is: how many neurons does the probe actually need?

**k-sparse probing** constrains the probe to use at most $k$ neurons {% cite "gurnee2023neurons" %}. Rather than fitting a weight vector over all $d$ neurons in a layer, the probe selects the $k$ most informative neurons and fits weights only on those. This is a hard L0 constraint (exactly $k$ nonzero weights), not L1 regularization.

The results reveal how features are organized across neurons:

- At **$k = 1$**, middle-layer neurons in large models can individually classify features like "is Python code," specific natural languages, and data distributions with high accuracy. These are **monosemantic neurons**: single neurons dedicated to single concepts.
- In **early layers**, $k = 1$ performance is poor. Features like "contains a digit" require $k = 5$ or more neurons. The feature is distributed across multiple polysemantic neurons, each of which individually responds to many unrelated inputs. This is precisely the pattern predicted by [superposition](/topics/superposition/).
- **Sparsity increases with model scale in this comparison.** Across the tested Pythia models (70M to 6.9B parameters), larger models often required fewer neuron coordinates for the same probe target. That is consistent with greater alignment between some features and individual neurons, but it does not show that larger models generally escape superposition.

A rotation baseline tests whether the result depends on the model's neuron basis. Randomly rotating the activation space and repeating $k = 1$ probing reduces performance, showing that the original coordinates are more aligned with these labels than a typical random basis. This supports a privileged-basis claim for the tested features; it does not make every successful single-neuron label monosemantic.{% sidenote "Sparse probing connects probing to the [superposition](/topics/superposition/) research program. A target that requires several neurons is consistent with a distributed representation, while strong $k=1$ performance indicates unusual alignment with one coordinate. Neither observation alone identifies the model's causal feature or rules out other concepts encoded by the same neurons." %}

Sparse probing also sharpens the probe complexity debate. Constraining a linear probe to very few neurons limits the computation it can perform. A successful $k = 1$ probe shows that one neuron coordinate makes the labels readily separable. The neuron may still track a correlate, respond to other concepts, or be unused by the model, so this result should guide causal tests rather than replace them.

But probe accuracy, whether sparse or dense, still faces a more fundamental challenge.

## The Probing Critique: Correlation vs. Causation

High probe accuracy tells us information *exists* in the representations. It does *not* tell us the model *uses* that information. This is the correlation-vs-causation gap at the heart of the probing debate.

### MDL Probing: Measuring Effort, Not Accuracy

Voita and Titov (2020) showed why probe accuracy alone is incomplete {% cite "voita2020mdl" %}. A representation can support good held-out accuracy while requiring far more examples or parameters than another representation. Random or untrained baselines help expose how much performance comes from the probe and from information already present in the input, rather than from a representation shaped to make the target accessible.

Minimum Description Length (MDL) probing reframes the question. Instead of asking "can a probe predict this property?", ask "how much effort does the probe need?"

Better representations require simpler probes (lower description length). Think of it as compression: good representations compress the labels more, requiring less effort to decode them. A representation where part-of-speech can be read off with a simple weight vector encodes POS more accessibly than one where the probe needs thousands of training examples and a high-rank weight matrix to decode the same labels.

MDL probing is more informative than accuracy alone. It distinguishes between representations where information is readily available (low MDL) and representations where the probe must do significant computation (high MDL). But MDL is still a correlational measure. It tells us how *easily accessible* a property is, not whether the model *actually accesses* it.

### Amnesic Probing: The Bridge to Causation

Elazar et al. (2021) added an intervention to the probing workflow {% cite "elazar2021amnesic" %}. Instead of asking only “can we decode property $Z$?”, they asked what happens to task performance after removing the linearly decodable signal used by the probe.

Their method uses Iterative Null-Space Projection (INLP) to remove a probe-accessible subspace, then measures the downstream effect. A performance drop is evidence that information in the removed subspace mattered. No effect is weaker evidence: nonlinear, redundant, or differently encoded information may remain, and the projection can remove signals correlated with the target as well as the intended property.

Elazar et al. found that **conventional probing performance was not correlated with task importance** in their experiments. Consider this scenario:

- A linear probe detects part-of-speech with 95% accuracy at layer 6.
- But removing POS information from layer 6 does *not* hurt language modeling performance.
- The information is *there* but the model does *not rely on it*.

Conventional probe accuracy can support the wrong mechanistic story. A property may be easy to decode because it is a correlated byproduct, or hard to decode with a linear classifier even though the model uses it through a nonlinear or distributed computation.

The practical lesson is to separate accessibility from use {% cite "belinkov2022probing" %}. Probes detect statistical structure. Baselines help interpret that structure, while interventions test causal hypotheses under a chosen counterfactual. Even interventions require care because removing one subspace can have off-target effects or leave redundant information behind.

<details class="pause-and-think">
<summary>Pause and think: Probes and causation</summary>

A probe achieves 95% accuracy at detecting part-of-speech from layer 6 activations. Does the model "know" POS? Does it "use" POS? How would you test the difference?

The model "knows" POS in the sense that the information is linearly decodable from its representations. But "knowing" and "using" are different. To test whether the model uses POS, you would need an intervention: remove POS information (via amnesic probing or [activation patching](/topics/activation-patching/)) and measure whether downstream task performance degrades. If it does, POS is causally relevant. If it does not, POS is a byproduct, encoded but not relied upon.

</details>

## Attention Patterns Are Another Observational Readout

[Attention heatmaps](/topics/reading-attention-patterns/) and probes make the same kind of epistemic move at different levels. A probe shows that information can be decoded from an activation; a heatmap shows where a head assigns its reading weight. Neither establishes what the model's downstream computation needs. For attention, we must also inspect the OV circuit and intervene on the head before turning a visible pattern into a mechanistic claim.

## The Key Limitation: Observation Cannot Establish Causation

Probing classifiers detect what information is linearly decodable from representations. They can reveal rich structure, from part-of-speech labels to syntax trees. But probe accuracy is not correlated with task importance. Information can be encoded yet unused. Attention patterns show where heads look, but not what information the head moves or whether the attended information matters downstream.

None of these tools establish whether the detected information is *causally necessary* for the model's behavior. A probe detects syntax at layer 6, but does the model *use* syntax at layer 6? A head attends to the previous token, but does that attention *matter* for the output?

All observational tools establish *correlations*: the information co-occurs with the activations. To establish *causation*, we need a different kind of experiment, one where we *intervene* on the model's internals and observe changes in behavior. If we *change* an intermediate activation and observe a *change* in the model's output, we have causal evidence.

[Activation patching](/topics/activation-patching/) replaces an internal activation and measures the downstream change; path patching narrows the intervention to a proposed connection. These methods move from “what can we decode?” toward “what changes under this intervention?”, a stronger claim, though still not proof that the resulting description is complete.
