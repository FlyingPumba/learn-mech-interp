---
title: "Scaling Monosemanticity and Feature Steering"
description: "How scaling sparse autoencoders to millions of features revealed multilingual, multimodal, and abstract concepts, and how clamping these features enables steering model behavior."
order: 3
prerequisites:
  - title: "Feature Dashboards and Automated Interpretability"
    url: "/topics/sae-interpretability/"

glossary:
  - term: "Feature Splitting"
    definition: "The phenomenon where a single feature in a smaller SAE splits into multiple, more specific features when the SAE dictionary size is increased, revealing finer-grained structure in model representations."
  - term: "Feature Steering"
    definition: "A technique for controlling model behavior by artificially amplifying or suppressing specific SAE features during inference, effectively pushing model outputs toward or away from concepts those features represent."
---

## From Toy Models to Frontier Models

The first sparse autoencoders extracted 4,096 interpretable features from a one-layer transformer with 512 neurons {% cite "bricken2023monosemanticity" %}. That result was encouraging but raised an obvious question: does this approach scale? A one-layer transformer is orders of magnitude smaller than the models used in production. If SAEs only work on toy systems, they are an interesting curiosity but not a practical tool for understanding the models that matter.

Templeton et al. (2024) showed that the training recipe could be applied at a much larger scale {% cite "templeton2024scaling" %}. They trained sparse autoencoders on a middle-layer residual stream of Claude 3 Sonnet with dictionaries as large as 34 million latents. Approximately 12 million latents were active under the study's measurement procedure.{% sidenote "A 'dead' latent does not activate over the sample used to assess it. Dead-latent rates depend on the architecture, initialization, optimizer, training data, and threshold, so the rate from this SAE should not be generalized to every variant." %}

The jump from 4,096 features in a toy model to 34 million features in a frontier model is enormous. That the resulting features are interpretable at this scale is a significant empirical result. It suggests that the dictionary learning approach to decomposing superposition is not limited to simple settings but extends to the regime where interpretability is most needed.

## Multilingual, Multimodal, and Abstract Features

The features discovered at scale have properties that features from smaller models only hinted at. Three properties stand out.

**Some features activate across languages.** The “Golden Gate Bridge” latent responds to relevant examples in several languages. One learned direction therefore tracks a pattern that is not tied to a single language's token forms. The dashboard alone cannot show that the representation is wholly language-independent or that other language-specific bridge features do not coexist.

<figure>
  <img src="images/golden-gate-bridge-feature.png" alt="The Golden Gate Bridge feature dashboard showing activations on English text describing the bridge (left), multilingual activations on Japanese, Korean, and Russian text about the same concept (center), and relevant images of the Golden Gate Bridge that also activate the feature (right).">
  <figcaption>The Golden Gate Bridge feature activates across English descriptions, multiple other languages (Japanese, Korean, Russian), and relevant images. A single learned direction in activation space captures the concept independent of surface form. From Templeton et al., <em>Scaling Monosemanticity</em>. {%- cite "templeton2024scaling" -%}</figcaption>
</figure>

**Some features span input types.** A “code bugs” latent can activate on prose about bugs and on buggy code. This provides one shared readout across those cases, without ruling out separate representations elsewhere in the model.

**Candidate labels range from concrete to abstract.** Some latents admit entity-level labels such as “the Golden Gate Bridge,” while others have activation examples consistent with broader labels such as “scientific uncertainty,” “inner conflict,” or “deception.” The more abstract the label, the more important it is to seek counterexamples and alternative explanations.

> **Feature hierarchies:** SAE features exist at multiple levels of abstraction for the same concept. A specific feature for "the Golden Gate Bridge in San Francisco" coexists with a moderately general feature for "famous bridges," a broader feature for "large human-built structures," and a very general feature for "notable landmarks." The SAE dictionary captures this hierarchy, with different features at different levels of granularity.

Cross-language and cross-modal activation is evidence that some SAE directions track structure beyond a single surface form. It does not separate semantic representation from every correlated pattern, nor show that the direction is the model's unique representation of the concept.

## Dictionary Size and Feature Granularity

Templeton et al. compare dictionaries at several scales and report changes in which patterns individual latents isolate {% cite "templeton2024scaling" %}. A larger dictionary has capacity to split a broad activation cluster into narrower latents. That is not a monotonic guarantee of semantic quality: feature splitting can also make a concept less stable across SAE sizes, and proxy reconstruction metrics do not determine which granularity is most useful. The later [evaluation article](/topics/sae-variants-and-evaluation/) develops these tradeoffs.

<details class="pause-and-think">
<summary>Pause and think: What would you do with 12 million features?</summary>

With 12 million alive features, manual inspection is impossible. If examining one feature takes 5 minutes, inspecting all 12 million would take over 114 years of continuous work. What tools or methods would you need to make sense of features at this scale? Consider what "understanding" means when the number of features exceeds what any human could examine. How would you decide which features are worth investigating?

</details>

## Golden Gate Claude

Finding interpretable features is one thing. But do those features actually cause the model's behavior, or are they merely correlated with it? This is the distinction between observational and causal evidence that runs through all of mechanistic interpretability. Feature dashboards show us what a feature activates on (observation). We need an intervention to test whether the feature drives behavior (causation).

Templeton et al. tested this with feature clamping {% cite "templeton2024scaling" %}. The procedure works in four steps:

1. Run the model's forward pass up to the middle layer, producing an activation vector $\mathbf{x}$.
2. Pass $\mathbf{x}$ through the SAE encoder to decompose it into feature activations $\mathbf{f}$.
3. Set a target feature's activation $f_i$ to a high value (clamp it), regardless of its natural activation.
4. Reconstruct the modified activation $\hat{\mathbf{x}}$ using the SAE decoder and continue the forward pass.

$$
\hat{\mathbf{x}} = \text{clamp}(\mathbf{f}, i, v) W_{\text{dec}} + \mathbf{b}_{\text{dec}}
$$

where $\text{clamp}(\mathbf{f}, i, v)$ sets $f_i = v$ and leaves the other SAE latents unchanged.{% sidenote "Feature clamping intervenes in the SAE's coordinates, then substitutes the SAE reconstruction for the original activation. Its effect can include reconstruction error as well as the targeted latent change, so matched reconstruction controls matter." %}

They clamped the "Golden Gate Bridge" feature and asked the model questions on unrelated topics.

<figure>
  <img src="images/feature-clamping-steering.png" alt="Four side-by-side comparisons of default model output versus feature-clamped output. Clamping the Golden Gate Bridge feature causes the model to describe itself as the bridge. Clamping a brain sciences feature redirects a physics question to neuroscience. Clamping a popular tourist attractions feature changes a local park recommendation to the Eiffel Tower. Clamping a transit infrastructure feature causes the model to confabulate walking across a bridge.">
  <figcaption>Feature clamping steers model behavior in targeted ways. Each row shows a default response (left) and the response after clamping a specific feature to a high value (right). The Golden Gate Bridge feature causes the model to identify as the bridge; other features redirect answers toward their respective concepts. From Templeton et al., <em>Scaling Monosemanticity</em>. {%- cite "templeton2024scaling" -%}</figcaption>
</figure>

**"What is the meaning of life?"** The model responded with something about how the meaning of life is like the Golden Gate Bridge, connecting people, spanning distances, standing as a beacon.

**"Tell me about yourself."** The model described itself as being deeply connected to the Golden Gate Bridge, expressing admiration for the structure.

Every response referenced the Golden Gate Bridge, regardless of the topic. The model did not produce gibberish. It wove the concept into fluent, coherent responses. This became known as "Golden Gate Claude," and it went viral as a demonstration of feature steering.

## The Causal Significance

Feature clamping provides causal evidence about a direction represented by an SAE latent: changing that coordinate changes the model's output distribution and generated text.

Consider the progression of evidence:

- **Observation:** "This feature activates on Golden Gate Bridge text." This tells us the feature is correlated with the concept. It might be a detector, or it might be a coincidence.
- **Intervention:** "Clamping this feature causes the model to talk about the Golden Gate Bridge." This tells us the feature is causally involved. It is not just a passive readout but an active direction that shapes what the model generates.

This is the same observational-to-causal progression that distinguishes activation patching from attention pattern analysis. Activation patterns tell us what exists. Interventions tell us what matters.

Clamping the selected latent repeatedly shifted generations toward Golden-Gate-Bridge content while preserving local fluency. That specificity is evidence that the decoder direction has a causal semantic effect. It does not show that the latent is the model's only bridge representation, that its natural activation is necessary for bridge reasoning, or that similarly clean interventions exist for arbitrary safety concepts.

<details class="pause-and-think">
<summary>Pause and think: From steering to safety</summary>

Golden Gate Claude was a playful demonstration, but imagine the same technique applied to a safety-relevant feature. If you could identify a "deception" feature and clamp it to zero, would that make the model unable to deceive? What if instead of clamping to zero, you clamped it to a high value, could you create a model that always deceives? What are the risks and limitations of this approach to controlling model behavior?

</details>

## Safety-Relevant Features

Templeton et al. did not only find features for bridges and code bugs. They also found features related to behaviors that matter for AI safety {% cite "templeton2024scaling" %}:

- **Deception features:** Features that activate when the model generates deceptive or misleading content.
- **Sycophancy features:** Features that activate when the model agrees with the user regardless of accuracy.
- **Dangerous content features:** Features related to harmful instructions, bias, and unsafe outputs.

The existence of these features opens three potential applications, each at a different stage of maturity.

**Monitoring.** If we can identify safety-relevant features reliably, we could track their activations during deployment. Are deception features activating more than expected? Are sycophancy features firing when the model should be pushing back? Feature monitoring could provide a real-time "dashboard" of model behavior that complements traditional behavioral testing.{% sidenote "Feature monitoring for safety is analogous to physiological monitoring in medicine. Rather than waiting for symptoms (behavioral failures), you continuously track vital signs (feature activations). The key question is whether feature activations are reliable vital signs, whether they are sensitive enough to catch problems and specific enough to avoid false alarms." %}

**Steering.** Golden Gate Claude shows that clamping one bridge-related latent can causally change generated behavior. If a safety-related latent passes similarly careful causal tests, amplifying or suppressing it could supplement training-based controls. A label such as “deception” is not enough: the intervention would need tests for missed cases, side effects, and alternative pathways.

**Auditing.** If features eventually provide a sufficiently complete and validated decomposition, they could contribute to an “affirmative safety case”: positive evidence about internal mechanisms, rather than only the absence of observed failures.

These are promising directions, not accomplished facts. Critical open questions remain. Can monitoring features actually catch safety failures that behavioral testing misses? We do not know yet. Can feature steering replace or supplement RLHF? Clamping a single feature is crude, and real safety requires nuanced control across many features simultaneously. Is there a path to an affirmative safety case based on feature inspection? This requires features to be complete (capturing everything the model represents) and reliable (consistently firing for the concepts they represent), two properties that have not been established.

The limitations that apply to SAEs in general apply with special force to safety applications. If SAE features are not unique (different training runs produce different features), which features do we monitor? If features suffer from absorption (where parent features fail to fire for inputs that match child features), monitoring may miss important activations. If interpretability is partly illusory (features look interpretable but are not complete), safety conclusions may be unreliable.

## From Features to Circuits

The scaling results provide many interpretable latents and selected examples with causal steering effects. Individual features are still not circuits. Labeling a “deception” latent does not tell us how the model decides to deceive, whether the latent is necessary, or what computations produce its activation.

To build full mechanistic understanding, we need to trace how features connect, which features cause which other features, and how information flows through the network at the feature level rather than the head level. This is the domain of attribution graphs and circuit tracing, which build on SAE features as their basic vocabulary.

The progression mirrors what we saw with attention heads. First, we identified individual heads (Name Movers, S-Inhibition heads). Then, we traced connections between heads to discover circuits (the IOI circuit). SAE features are at the "identifying individual components" stage. The next step is connecting them into feature-level circuits.

The SAE architecture itself also has room for improvement. The L1-regularized SAE used in these experiments has known biases, and newer objectives try to reduce them without giving up sparse, labelable latents. The [next article on SAE variants and evaluation](/topics/sae-variants-and-evaluation/) covers those changes and the remaining failure modes.
