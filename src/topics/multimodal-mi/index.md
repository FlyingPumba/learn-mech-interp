---
title: "Multimodal Mechanistic Interpretability"
description: "Extending mechanistic interpretability beyond text to vision models, multimodal systems, and diffusion models -- what works, what breaks, and what remains unknown."
prerequisites:
  - title: "Universality Across Models"
    url: "/topics/universality/"
difficulty: "advanced"
block: "circuit-tracing-and-comparative-mi"
category: "applications"
---

## Beyond Text

Everything we have studied so far -- [SAEs](/topics/sparse-autoencoders/), [transcoders](/topics/transcoders/), [activation patching](/topics/activation-patching/), [attribution graphs](/topics/circuit-tracing/), [crosscoders](/topics/crosscoders-and-model-diffing/) -- was developed for and applied to language models. But AI systems increasingly process images, video, audio, and combinations of modalities. Does mechanistic interpretability transfer beyond text?

The answer, surveyed by Lin et al. (2025), is cautiously optimistic {% cite "lin2025multimodal" %}. Many MI techniques transfer to vision and multimodal models with moderate adjustments. Some even become easier in multimodal settings thanks to shared embedding spaces that provide "free" feature labels. But new challenges arise, and the field is considerably less mature than text-based MI.{% sidenote "The maturity gap is roughly 2-3 years. Text-based MI has canonical examples (IOI circuit, Golden Gate Claude), established evaluation frameworks (SAEBench), and large-scale studies (Scaling Monosemanticity, Biology of an LLM). Multimodal MI has promising early results but no canonical example of a complete circuit in a vision or multimodal model." %}

This article covers three model families: contrastive vision-language models (CLIP), generative vision-language models (VLMs like LLaVA and GPT-4V), and text-to-image diffusion models. For each, we examine what works, what is still early, and what remains unknown.

## CLIP: The Bridge Between Text and Vision

CLIP (Contrastive Language-Image Pretraining) trains a vision encoder and a text encoder to produce aligned representations in a shared embedding space. Images and text that describe the same concept end up near each other in this shared space.

Why CLIP is particularly exciting for MI:

- The **shared embedding space provides free labeling**. When you extract an SAE feature from CLIP's vision encoder, you can project its direction into the text embedding space to get a natural language description of what the feature represents. No human labeling required.
- MI techniques from language -- probing, SAEs, steering -- transfer to the vision side with moderate adjustments. The architecture is a vision transformer, which shares the same basic structure as language transformers.
- CLIP is widely used as a backbone for larger multimodal systems, so understanding CLIP's internals has downstream implications.

### SAEs for CLIP's Vision Transformer

Recent work (2024-2025) applies SAEs to CLIP's vision encoder with encouraging results:

- SAE features in CLIP correspond to recognizable visual concepts: objects, textures, spatial arrangements, and scene types.
- The "free labeling" advantage works in practice: projecting SAE feature directions into the shared text-image space yields natural language descriptions that match what humans see in the feature's activating images.
- **10-15% of features are steerable** -- modifying them changes CLIP's output in predictable ways. This parallels the [feature steering](/topics/scaling-monosemanticity/) story from text models: extract features, verify they are monosemantic, demonstrate causal effects via intervention.{% sidenote "The 10-15% steerability rate for CLIP features is comparable to what has been found in text models. Most SAE features are not individually steerable -- either because they participate in larger circuits that resist individual modification, or because their effect on the output is too small to produce measurable behavioral changes." %}

### Steering in Vision

Feature steering extends naturally from text to vision:

- Clamping a visual SAE feature steers CLIP's representation, analogous to [Golden Gate Claude](/topics/scaling-monosemanticity/) in the text domain
- Steerable features can defend against **typographic attacks** -- adversarial text overlaid on images that confuses the model about image content
- Visual steering has been used to steer downstream multimodal LLMs (e.g., LLaVA) by modifying CLIP's visual encoder output before it enters the language model

The broader lesson: the steering paradigm from [representation engineering](/topics/representation-engineering/) is not specific to language. It works wherever the [linear representation hypothesis](/topics/linear-representation-hypothesis/) holds -- and it appears to hold in vision transformers as well.

<details class="pause-and-think">
<summary>Pause and think: CLIP's free labeling advantage</summary>

CLIP's shared embedding space lets you describe vision features in natural language by projecting SAE directions into text space. What assumptions does this rely on? When might this "free labeling" approach fail?

It relies on the shared embedding space being well-aligned between modalities -- that nearby points in the joint space truly represent the same concept across text and images. For well-trained CLIP models, this works for common concepts. But it may fail for visual features that lack clean textual descriptions (fine textures, spatial relationships, artistic styles) or for features that exist in one modality but not the other. The free labeling is a powerful heuristic, not a guarantee.

</details>

## Generative Vision-Language Models

Vision-language models (VLMs) like LLaVA and GPT-4V process images through a vision encoder (typically CLIP) and feed the visual representations into a language model that generates text responses about the image.

MI for VLMs investigates several questions:

- **How visual information flows** from the vision encoder into language model layers. Do visual tokens behave like special text tokens, or does the model process them through separate pathways?
- **Whether causal tracing works** for localizing where visual objects are processed. Activation patching can identify which layers and positions are critical for answering questions about specific objects in an image.
- **How the model integrates visual and textual information.** Does integration happen through dedicated "bridge" layers, or is it distributed across the entire language model?

The findings so far suggest that VLMs treat visual tokens similarly to text tokens within the language model layers, but integration is distributed rather than concentrated in specific layers. However, most findings are observational rather than causal -- the field has not yet produced a complete circuit analysis of a VLM behavior analogous to the [IOI circuit](/topics/ioi-circuit/) for language.{% sidenote "One challenge for VLM circuit analysis is that the vision encoder and language model were typically trained separately and connected through a small number of adapter layers. The adapter is the critical interface between modalities, but it is often a simple linear projection -- which makes it hard to identify complex integration mechanisms." %}

## Diffusion Model Interpretability

Text-to-image diffusion models (e.g., Stable Diffusion, DALL-E) generate images by iteratively denoising random noise over many timesteps. These models present a unique challenge and opportunity for MI.

### Functionally Distinct Attention Mechanisms

Circuit analysis of diffusion models reveals that different attention heads serve **functionally distinct roles**:

- **Edge detection heads** that identify boundaries and contours
- **Texture analysis heads** that process surface patterns and materials
- **Semantic understanding heads** that encode high-level object categories
- **Composition heads** that manage spatial relationships between objects

Ablation experiments show that removing critical bottleneck layers causes 25-128% performance degradation, confirming that these functional specializations are causally important for image quality.

### The Temporal Dimension

Diffusion models introduce a dimension absent from language models: *time*. In a language model, information flows through layers (a spatial dimension within the network). In a diffusion model, it also flows through denoising steps (a temporal dimension).

The temporal evolution of concepts follows a consistent pattern:

- **Early timesteps:** Features correspond to coarse layout, color palette, and scene composition
- **Middle timesteps:** Features correspond to object boundaries and spatial relationships
- **Late timesteps:** Features correspond to fine textures and details

SAEs applied to diffusion models show how concepts become more refined as denoising progresses. A feature that initially represents "something red in the upper left" evolves through timesteps into "a specific red flower with detailed petal structure." This temporal evolution of features is unique to diffusion models and requires new MI methods beyond what works for language.

### SAEs for Diffusion Models

Applying SAEs to diffusion model activations reveals feature directions that correspond to structured image regions independent of high-level semantics. The concept of a "diffusion steering lens" -- extending the logit lens concept to vision transformers within diffusion models -- allows researchers to observe how the model's internal predictions change across denoising steps, analogous to how the [logit lens](/topics/logit-lens-and-tuned-lens/) reveals prediction evolution across layers in language models.

<details class="pause-and-think">
<summary>Pause and think: What model architectures need new MI methods?</summary>

MI techniques developed for language models (SAEs, probing, patching) transfer to vision and multimodal models with some adaptation. But diffusion models required the concept of temporal evolution, which is absent from language models.

What other model architectures might require fundamentally new MI approaches? Consider reinforcement learning agents that interact with environments, models that use external tools (calculators, search engines), or models with explicit memory systems. What new dimensions of computation would MI need to address in each case?

</details>

## An Honest Assessment

The state of multimodal MI can be summarized concisely:

**What works:**
- SAEs transfer well to vision encoders, especially CLIP
- Probing and activation patching extend to multimodal settings
- Feature steering works across modalities wherever the linear representation hypothesis holds

**What is still early:**
- VLM integration mechanisms are poorly understood -- we know visual and textual information are combined, but not exactly how
- Diffusion circuit analysis is nascent -- functional specialization has been identified, but complete circuits have not been traced
- There is no multimodal equivalent of the IOI circuit -- no canonical, deeply analyzed example yet

**The gap:**
- Multimodal MI is largely observational. Causal analysis lags behind the language model field by 2-3 years. Most results describe what features exist or what correlations hold, without the rigorous causal validation that characterizes the best text-based MI work.{% sidenote "The observational-to-causal gap is a recurring theme in MI's expansion. Each new domain starts with observational findings ('these features exist'), progresses to causal verification ('these features matter'), and eventually produces circuit-level understanding ('here is how the features connect'). Language MI has reached the third stage for some behaviors. Multimodal MI is still transitioning from the first to the second." %}

## Key Takeaways

- **CLIP interpretability** benefits from the shared text-image embedding space, which provides free labeling for visual SAE features. SAEs for CLIP find interpretable visual concepts, and 10-15% of features are steerable.
- **VLM interpretability** is early-stage. Visual tokens are processed similarly to text tokens, but integration mechanisms between modalities are not yet well understood.
- **Diffusion model interpretability** reveals functionally distinct attention mechanisms and temporal concept evolution across denoising steps -- a dimension absent from language model analysis.
- The field is expanding from single-model, single-modality analysis to cross-model, cross-modal investigation. The toolkit (SAEs, patching, steering) transfers, but each new modality introduces new challenges.
- **Persistent challenges:** no canonical multimodal circuit example, causal analysis lags behind observational findings, and the temporal dimension of diffusion models requires new methods.
