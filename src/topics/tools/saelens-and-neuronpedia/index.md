---
title: "SAE Lens and Neuronpedia"
seoTitle: "SAE Lens (SAELens) and Neuronpedia Guide"
description: "Using SAE Lens to train and analyze sparse autoencoders, then exploring features, testing interpretations, and steering models through Neuronpedia."
order: 3
prerequisites:
  - title: "Sparse Autoencoders"
    url: "/topics/sparse-autoencoders/"
  - title: "TransformerLens"
    url: "/topics/transformerlens/"
---

## The SAE Workflow Gap

[Sparse autoencoders](/topics/sparse-autoencoders/) (SAEs) decompose model activations into learned features. Going from the definition to an experiment requires practical tooling: we need to train or load an SAE, attach it to the correct model activation, inspect individual features, and test whether a candidate interpretation predicts behavior. **SAE Lens** (also styled SAELens) supports the programmatic workflow, while **Neuronpedia** supports interactive exploration and hosted interpretability data.

The [SAE Lens documentation](https://jbloomaus.github.io/SAELens/) and [GitHub repository](https://github.com/jbloomAus/SAELens) track the current Python interface. [Neuronpedia](https://www.neuronpedia.org/) provides the live browser interface, with separate [feature documentation](https://docs.neuronpedia.org/features) for dashboard fields and testing tools. These links matter because model releases, hosted SAE sets, and library APIs change faster than the underlying workflow described here.

## SAE Lens

SAE Lens is an open-source Python library for training and analyzing sparse autoencoders on language models {% cite "bloom2024saelens" %}. It connects SAE objects to model hook points and supplies common operations for loading releases, encoding activations, training new dictionaries, and evaluating reconstruction.

### Loading Pre-Trained SAEs

Training an SAE from scratch requires collecting a large activation dataset and optimizing a dictionary that balances reconstruction against sparsity. For many research questions, a released SAE is the better starting point. SAE Lens provides a consistent interface for loading releases from sources such as Hugging Face, including decompositions for GPT-2, Gemma, and Pythia families.

The typical workflow is to load a language model through [TransformerLens](/topics/transformerlens/) or another framework, load an SAE for one layer or component, run an input through the model, and encode that activation into sparse feature activations. SAE Lens records the metadata needed to match an SAE to its hook point, input width, architecture, and normalization choices.

A successful load does not prove that the SAE is suitable for the target distribution. Before interpreting features, check that the model, activation site, preprocessing, and SAE release agree, then measure reconstruction error and sparsity on the data the experiment will use.

### Training SAEs

When no suitable release exists, SAE Lens provides a training pipeline. Four choices determine what the resulting features can mean:

- **Architecture:** Standard rectified linear unit (ReLU), Gated, TopK, and JumpReLU SAEs impose sparsity in different ways. The [SAE variants article](/topics/sae-variants-and-evaluation/) explains the tradeoffs.
- **Activation site:** Residual stream, MLP output, attention output, and transcoder targets expose different computations.
- **Dictionary size:** A larger expansion can separate more patterns, but increases training cost and can split one phenomenon across several features.
- **Training distribution:** Features reflect the activations used for training, so a dictionary trained on one language or domain may omit structure needed elsewhere.

SAE Lens handles activation collection, training loops, checkpoints, and evaluation metrics such as reconstruction loss, L0 sparsity, and explained variance. Training defaults evolve, so the current documentation and the configuration stored with a trusted release are better starting points than fixed hyperparameters copied from an older experiment.

### Analysis and Integration

SAE Lens can pass learned features into **SAE-Vis** dashboards, export data for [Neuronpedia](#neuronpedia), or supply sparse activations to downstream experiments such as [feature-level circuit tracing](/topics/circuit-tracing/). It can also use Hugging Face model modules as hook targets rather than requiring one model-loading path.

This flexibility does not make activation sites interchangeable. An SAE is defined for a particular activation space. Hook identity, tensor shape, and any weight or activation preprocessing must match the conditions under which it was trained.

## Neuronpedia

**Neuronpedia** is a web platform for interactively exploring model internals. SAE feature dashboards remain a central use case, but the platform now also hosts probes, custom vectors, circuit-tracing tools, and application programming interfaces (APIs). Where SAE Lens is a programmer's tool, Neuronpedia lets us browse hosted decompositions, search features and vectors, and test candidate interpretations in the browser.

### Feature Dashboards

The core unit for SAE analysis is the **feature dashboard**. A dashboard can include:

- **Top activating examples:** Dataset sequences with tokens colored by activation strength.
- **Activation statistics:** How frequently and strongly the feature fires on the sampled distribution.
- **Logit effects:** Tokens promoted or suppressed by the feature's decoder direction under the displayed calculation.
- **Generated and community explanations:** Natural-language labels proposed from selected examples.
- **Live activation tests:** Custom text run through the hosted model to test whether the feature responds as predicted.

> **Feature Dashboard:** A collection of evidence about one learned feature, including activating examples, statistics, logit effects, and candidate explanations.

The dashboard is a hypothesis generator, not a completed interpretation. Top examples overrepresent strong positive cases, generated labels can collapse several patterns into one phrase, and the displayed dataset can omit counterexamples. A useful label should predict held-out positives, negatives, and confounders before it is used in a causal claim.{% sidenote "A dashboard can make a feature look more coherent than it is because the interface is optimized to display salient activations. Sampling random activations and deliberately searching for false positives gives a less flattering but more informative test." %}

### Search, Steering, and APIs

Semantic search starts from a description such as “Python syntax” and retrieves features or vectors with related explanations. Inference search starts from custom text and finds features that activate on it. The two directions support different workflows: one tests whether a proposed concept has a candidate feature, while the other asks what a particular input activates.

Neuronpedia's steering interface clamps hosted latents or custom vectors during generation. This makes feature intervention accessible without writing a hook, but the same cautions as [addition steering](/topics/addition-steering/) apply. A vivid output change does not establish that the feature has one meaning, that the intervention stayed in-distribution, or that off-target effects are absent.

Feature data and several platform functions are also exposed through APIs. Programmatic access makes it possible to move from one attractive dashboard to a controlled evaluation over many examples, which is usually the point where an interpretation becomes testable.

## Gemma Scope Releases

The original **Gemma Scope** release provided pretrained SAEs across layers and sublayers of Google DeepMind's Gemma 2 models at several dictionary sizes {% cite "lieberum2024gemma" %}. **Gemma Scope 2** extends the collection to Gemma 3 and adds transcoders, including skip transcoders and cross-layer transcoders. Google DeepMind maintains the current [Gemma Scope release page](https://deepmind.google/models/gemma/gemma-scope/).

The releases are available for programmatic analysis and through Neuronpedia's interactive views, making them a practical starting point when the research question fits Gemma and the released activation sites. Millions of hosted features do not remove the evaluation problem: a dashboard label remains a hypothesis until it predicts held-out activations and survives causal or behavioral tests.

<details class="pause-and-think">
<summary>Pause and think: From search result to evidence</summary>

You search Neuronpedia for “deception” and find a feature whose strongest examples contain lies. What should happen before calling it a deception feature?

Test the feature on held-out deceptive and truthful examples, then add confounders such as quoted lies, fictional dialogue, negations, and discussion of deception without deceptive intent. Measure false positives and false negatives with SAE Lens or the API. If the label survives, intervene on the feature and compare behavioral effects with matched control features. Search narrows the candidates; controlled evaluation supplies the evidence.

</details>

## The MI Toolchain

The tools cover complementary parts of a mechanistic interpretability workflow:

| Tool | Role |
|---|---|
| [TransformerLens](/topics/transformerlens/) | Model instrumentation, activation caches, and hook-based interventions |
| [nnsight](/topics/nnsight-and-nnterp/) | Intervention tracing and remote execution for large models |
| **SAE Lens** | SAE training, loading, evaluation, and programmatic feature analysis |
| **Neuronpedia** | Hosted interpretability data, interactive inspection, search, steering, and APIs |

A project might begin with Neuronpedia to find candidate features, move to SAE Lens for evaluation over a controlled dataset, and use TransformerLens or nnsight to test causal effects. The order can reverse when no released decomposition exists: collect activations, train and evaluate an SAE, inspect its features, then publish dashboards or data for others to examine.

Tool names do not settle the scientific question. The stable workflow is to match a decomposition to its activation space, generate candidate interpretations, test them on held-out and adversarial examples, and measure what changes under intervention.
