---
title: "Multimodal Mechanistic Interpretability"
description: "How mechanistic interpretability extends beyond text to vision-language and diffusion models, including promising transfers and modality-specific limits."
order: 7
prerequisites:
  - title: "Universality Across Models"
    url: "/topics/universality/"

glossary:
  - term: "Multimodal Interpretability"
    definition: "The application of mechanistic interpretability techniques to models that process multiple input modalities (such as vision and language), investigating how representations are shared or transformed across modalities."
---

## Beyond Text

Everything we have studied so far, [SAEs](/topics/sparse-autoencoders/), [transcoders](/topics/transcoders/), [activation patching](/topics/activation-patching/), [attribution graphs](/topics/circuit-tracing/), [crosscoders](/topics/crosscoders/), was developed for and applied to language models. But AI systems increasingly process images, video, audio, and combinations of modalities. Does mechanistic interpretability transfer beyond text?

Probing, sparse decomposition, patching, and steering have all been adapted beyond text {% cite "lin2025multimodal" %}. Shared image–text spaces can also suggest labels for visual features. Those labels remain hypotheses, however, and multimodal models introduce interfaces and time-dependent computations that language-only methods were not designed to handle.{% sidenote "Compared with text-model interpretability, multimodal work has fewer widely replicated circuit case studies and less settled evaluation practice. It is safer to describe that qualitative gap than to assign it a precise number of years." %}

Three model families expose different parts of this transfer problem: contrastive vision-language models such as CLIP, generative vision-language models (VLMs), and text-to-image diffusion models.

<figure>
  <img src="images/multimodal-mi-taxonomy.png" alt="Taxonomy diagram of multimodal mechanistic interpretability. Left column shows methods split into two groups: methods adapted from LLM interpretability (linear probing, logit lens, causal tracing, representation decomposition, general task vectors, sparse autoencoders, neuron-level descriptions) and multimodal-specific methods (text-explanations of internal embeddings, network dissection, cross-attention based interpretation, training data attribution, feature visualization). Center column shows three model architectures: non-generative vision-language models with contrastive learning, generative vision-language models with an adapter between image encoder and LLM, and text-to-image generative models with denoising. Right column lists applications including mitigating spurious correlations, zero-shot segmentation, in-context learning, model editing, detecting hallucinations, improving safety, improving compositionality, and controllable generation.">
  <figcaption>An overview of the multimodal MI landscape. Methods adapted from LLM interpretability (top left) and multimodal-specific methods (bottom left) are applied across three model families: contrastive vision-language models, generative VLMs, and text-to-image diffusion models. From Lin et al., <em>A Survey on Mechanistic Interpretability for Multi-Modal Foundation Models</em>. {%- cite "lin2025multimodal" -%}</figcaption>
</figure>

## CLIP: The Bridge Between Text and Vision

CLIP (Contrastive Language-Image Pretraining) trains a vision encoder and a text encoder to produce aligned representations in a shared embedding space. Images and text that describe the same concept end up near each other in this shared space.

Why CLIP is particularly exciting for MI:

- The **shared embedding space suggests candidate labels**. Projecting a visual SAE direction toward nearby text embeddings can produce a natural-language hypothesis about the feature. Human inspection and counterexamples are still needed.
- MI techniques from language, probing, SAEs, steering, transfer to the vision side with moderate adjustments. The architecture is a vision transformer, which shares the same basic structure as language transformers.
- CLIP is widely used as a backbone for larger multimodal systems, so understanding CLIP's internals has downstream implications.

### SAEs for CLIP's Vision Transformer

Recent work (2024-2025) applies SAEs to CLIP's vision encoder with encouraging results:

- SAE features in CLIP can correspond to recognizable visual patterns such as objects, textures, spatial arrangements, and scene types.
- Text-space projections can yield labels that agree with many highly activating images, making them a useful starting point for evaluation rather than an automatic interpretation.
- A subset of features can be **steered**: modifying them changes measured outputs in predictable ways on the tested data. This parallels [feature steering](/topics/scaling-monosemanticity/) in text models and supplies causal evidence for a feature's effect, though not a complete semantic account.{% sidenote "Reported steerability rates depend on the model, SAE, intervention strength, and success metric. A feature that fails an individual steering test may have a small effect, participate in a larger circuit, or be poorly captured by the learned dictionary." %}

### Steering in Vision

Feature steering extends naturally from text to vision:

- Clamping a visual SAE feature steers CLIP's representation, analogous to [Golden Gate Claude](/topics/scaling-monosemanticity/) in the text domain
- Steerable features can defend against **typographic attacks**, adversarial text overlaid on images that confuses the model about image content
- Visual steering has been used to steer downstream multimodal LLMs (e.g., LLaVA) by modifying CLIP's visual encoder output before it enters the language model

These studies suggest that the [representation-control](/topics/representation-control/) paradigm is not specific to language. Whether it works for a particular visual concept remains an empirical question about the model, layer, direction, and intervention.

<details class="pause-and-think">
<summary>Pause and think: CLIP's free labeling advantage</summary>

CLIP's shared embedding space lets you describe vision features in natural language by projecting SAE directions into text space. What assumptions does this rely on? When might this "free labeling" approach fail?

The method assumes that proximity in the joint embedding space reflects the same concept across text and images. It can fail when a visual pattern lacks a clean textual description, when the modalities contain different information, or when the projected direction exploits a correlate. The resulting phrase is a candidate label, not a guarantee.

</details>

## Generative Vision-Language Models

Vision-language models (VLMs) like LLaVA and GPT-4V process images through a vision encoder (typically CLIP) and feed the visual representations into a language model that generates text responses about the image.

MI for VLMs investigates several questions:

- **How visual information flows** from the vision encoder into language model layers. Do visual tokens behave like special text tokens, or does the model process them through separate pathways?
- **Whether causal tracing works** for localizing where visual objects are processed. Activation patching can identify which layers and positions are critical for answering questions about specific objects in an image.
- **How the model integrates visual and textual information.** Does integration happen through dedicated "bridge" layers, or is it distributed across the entire language model?

Studies of particular VLMs suggest that visual tokens can share pathways with text tokens inside the language model, while integration may be distributed across layers. The result is architecture-dependent: some systems use a small adapter, while others fuse modalities differently. Most available findings localize representations or effects rather than tracing an end-to-end circuit analogous to the [IOI circuit](/topics/ioi-circuit/).{% sidenote "When a separately trained vision encoder feeds an adapter into a language model, the adapter is an obvious interface to inspect. A simple adapter does not imply simple integration, however; later attention and MLP layers can transform and combine the imported visual information." %}

## Diffusion Model Interpretability

Text-to-image diffusion models (e.g., Stable Diffusion, DALL-E) generate images by iteratively denoising random noise over many timesteps. These models present a unique challenge and opportunity for MI.

### Functionally Distinct Attention Mechanisms

Circuit analysis of diffusion models reveals that different attention heads serve **functionally distinct roles**:

- **Edge detection heads** that identify boundaries and contours
- **Texture analysis heads** that process surface patterns and materials
- **Semantic understanding heads** that encode high-level object categories
- **Composition heads** that manage spatial relationships between objects

Ablation experiments can test whether these components matter for a chosen image-quality or task metric. Large drops after removing a bottleneck provide causal evidence for that component's role, but the interpretation depends on the baseline, metric, and severity of the intervention.

### The Temporal Dimension

Diffusion models introduce a dimension absent from language models: *time*. In a language model, information flows through layers (a spatial dimension within the network). In a diffusion model, it also flows through denoising steps (a temporal dimension).

A common, but not universal, coarse-to-fine pattern is:

- **Early timesteps:** Features correspond to coarse layout, color palette, and scene composition
- **Middle timesteps:** Features correspond to object boundaries and spatial relationships
- **Late timesteps:** Features correspond to fine textures and details

SAEs applied to diffusion models show how concepts become more refined as denoising progresses. A feature that initially represents "something red in the upper left" evolves through timesteps into "a specific red flower with detailed petal structure." This temporal evolution of features is unique to diffusion models and requires new MI methods beyond what works for language.

### SAEs for Diffusion Models

Applying SAEs to diffusion model activations reveals feature directions that correspond to structured image regions independent of high-level semantics. The concept of a "diffusion steering lens", extending the logit lens concept to vision transformers within diffusion models, allows researchers to observe how the model's internal predictions change across denoising steps, analogous to how the [logit lens](/topics/logit-lens-and-tuned-lens/) reveals prediction evolution across layers in language models.

<details class="pause-and-think">
<summary>Pause and think: What model architectures need new MI methods?</summary>

MI techniques developed for language models (SAEs, probing, patching) transfer to vision and multimodal models with some adaptation. But diffusion models required the concept of temporal evolution, which is absent from language models.

What other model architectures might require fundamentally new MI approaches? Consider reinforcement learning agents that interact with environments, models that use external tools (calculators, search engines), or models with explicit memory systems. What new dimensions of computation would MI need to address in each case?

</details>

## What the Evidence Supports So Far

The evidence separates demonstrated capabilities from missing end-to-end accounts:

**What has been demonstrated:**
- SAEs can learn interpretable candidate features in tested vision encoders, including CLIP
- Probing and activation patching can be applied at multimodal activation sites
- Selected feature interventions change measured outputs in some vision and multimodal models

**What is still early:**
- For vision-language models, current studies localize some integration effects but do not yet provide broad end-to-end mechanisms
- Diffusion studies identify functional specialization, with relatively few replicated circuit accounts
- The field lacks a canonical multimodal case study with the depth of intervention and evaluation found in the IOI literature

**The gap:**
- Much multimodal MI remains observational. Causal studies exist, but there are fewer end-to-end, replicated circuit accounts than in language-model work.{% sidenote "A field need not advance in a fixed sequence from observation to intervention to circuits. Still, separating those evidence types helps: a labeled feature, a causal effect, and an end-to-end mechanism answer different questions." %}

The most useful next benchmark would force all three levels of evidence into one analysis: interpretable candidate features, interventions showing that they matter, and an end-to-end account of how they interact. Language-model work has examples that approach this standard; multimodal MI does not yet have a similarly canonical circuit. Until it does, claims about shared features, causal control, and mechanism should remain separate.
