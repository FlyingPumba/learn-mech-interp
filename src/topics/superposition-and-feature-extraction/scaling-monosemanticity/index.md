---
title: "Scaling Monosemanticity and Feature Steering"
description: "How scaling sparse autoencoders to millions of features revealed multilingual, multimodal, and abstract concepts -- and how clamping these features enables steering model behavior."
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

Templeton et al. (2024) answered this question decisively {% cite "templeton2024scaling" %}. They trained sparse autoencoders on the middle-layer residual stream of Claude 3 Sonnet, a production-scale language model, and extracted 34 million latent features. After training, approximately 12 million of those features were alive (the rest were dead features that never activated).{% sidenote "Dead features are latent dimensions that never activate on any training input. They represent wasted dictionary capacity. In the 34-million-feature SAE, roughly 65% of features were dead. Mitigations exist, such as auxiliary loss terms that penalize inactivity, but dead features remain a significant issue in all SAE variants." %}

The jump from 4,096 features in a toy model to 34 million features in a frontier model is enormous. That the resulting features are interpretable at this scale is a significant empirical result. It suggests that the dictionary learning approach to decomposing superposition is not limited to simple settings but extends to the regime where interpretability is most needed.

## Multilingual, Multimodal, and Abstract Features

The features discovered at scale have properties that features from smaller models only hinted at. Three properties stand out.

**Features are multilingual.** A single feature fires for the same concept regardless of input language. The now-famous "Golden Gate Bridge" feature activates for English text about the bridge, French descriptions of it, Chinese references, and more. This is not a case of separate per-language features with similar activation patterns. It is one feature that has learned a language-independent concept. The model's internal representation is more abstract than its surface-level input.

<figure>
  <img src="images/golden-gate-bridge-feature.png" alt="The Golden Gate Bridge feature dashboard showing activations on English text describing the bridge (left), multilingual activations on Japanese, Korean, and Russian text about the same concept (center), and relevant images of the Golden Gate Bridge that also activate the feature (right).">
  <figcaption>The Golden Gate Bridge feature activates across English descriptions, multiple other languages (Japanese, Korean, Russian), and relevant images. A single learned direction in activation space captures the concept independent of surface form. From Templeton et al., <em>Scaling Monosemanticity</em>. {%- cite "templeton2024scaling" -%}</figcaption>
</figure>

**Features span modalities.** Some features fire for both natural language and code. A "code bugs" feature activates for written discussions about bugs and for actual buggy code. The model does not maintain separate representations for "talking about code" and "looking at code." It has a unified representation for the underlying concept.

**Features range from concrete to abstract.** The SAE dictionary captures features at many levels of specificity. Concrete features like "the Golden Gate Bridge" fire for specific entities. Domain-spanning features like "scientific uncertainty" fire across many different topics that share an abstract property. Features related to "inner conflict" and "deception" represent genuinely abstract concepts that cannot be reduced to surface patterns.

> **Feature hierarchies:** SAE features exist at multiple levels of abstraction for the same concept. A specific feature for "the Golden Gate Bridge in San Francisco" coexists with a moderately general feature for "famous bridges," a broader feature for "large human-built structures," and a very general feature for "notable landmarks." The SAE dictionary captures this hierarchy, with different features at different levels of granularity.

These properties collectively suggest that the model has learned genuine conceptual representations, not merely surface-level pattern matching. The fact that a single direction in activation space captures a concept across languages, modalities, and abstraction levels is evidence that the model's internal organization reflects semantic structure.

## Scaling Laws for Feature Discovery

Templeton et al. found that feature quality scales predictably with SAE size {% cite "templeton2024scaling" %}. Larger SAEs (more dictionary elements) produce features that activate more selectively, responding to narrower and more specific concepts. The improvement follows power-law relationships, directly analogous to the neural scaling laws that govern overall model performance.

$$
\text{Feature specificity} \propto (\text{SAE dictionary size})^{\alpha}
$$

where $\alpha$ is a positive exponent determined empirically. This scaling relationship has a practical implication: we can predict how large an SAE we need for a given level of feature quality. If we want features that distinguish "the Golden Gate Bridge" from "bridges in general," we need a dictionary large enough that the scaling law predicts sufficient specificity.

The scaling laws also reveal diminishing returns. Early increases in SAE size produce dramatic improvements in feature quality. Later increases yield smaller gains per additional dictionary element. This is the same pattern seen in language model scaling: the first billion parameters matter more than the last billion.

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
\hat{\mathbf{x}} = \mathbf{W}_{\text{dec}} \cdot \text{clamp}(\mathbf{f}, i, v) + \mathbf{b}_{\text{dec}}
$$

where $\text{clamp}(\mathbf{f}, i, v)$ sets $f_i = v$ and leaves all other features unchanged.{% sidenote "Feature clamping is conceptually similar to activation patching, but operates at the feature level rather than the component level. Where activation patching replaces an entire head or layer output, feature clamping modifies a single interpretable direction in the decomposed representation. This is a finer-grained intervention because SAE features are more specific than heads or layers." %}

They clamped the "Golden Gate Bridge" feature and asked the model questions on unrelated topics.

<figure>
  <img src="images/feature-clamping-steering.png" alt="Four side-by-side comparisons of default model output versus feature-clamped output. Clamping the Golden Gate Bridge feature causes the model to describe itself as the bridge. Clamping a brain sciences feature redirects a physics question to neuroscience. Clamping a popular tourist attractions feature changes a local park recommendation to the Eiffel Tower. Clamping a transit infrastructure feature causes the model to confabulate walking across a bridge.">
  <figcaption>Feature clamping steers model behavior in targeted ways. Each row shows a default response (left) and the response after clamping a specific feature to a high value (right). The Golden Gate Bridge feature causes the model to identify as the bridge; other features redirect answers toward their respective concepts. From Templeton et al., <em>Scaling Monosemanticity</em>. {%- cite "templeton2024scaling" -%}</figcaption>
</figure>

**"What is the meaning of life?"** The model responded with something about how the meaning of life is like the Golden Gate Bridge -- connecting people, spanning distances, standing as a beacon.

**"Tell me about yourself."** The model described itself as being deeply connected to the Golden Gate Bridge, expressing admiration for the structure.

Every response referenced the Golden Gate Bridge, regardless of the topic. The model did not produce gibberish. It wove the concept into fluent, coherent responses. This became known as "Golden Gate Claude," and it went viral as a demonstration of feature steering.

## The Causal Significance

Golden Gate Claude is an entertaining demonstration, but the scientific point behind it is serious. Feature clamping establishes a causal relationship between SAE features and model behavior.

Consider the progression of evidence:

- **Observation:** "This feature activates on Golden Gate Bridge text." This tells us the feature is correlated with the concept. It might be a detector, or it might be a coincidence.
- **Intervention:** "Clamping this feature causes the model to talk about the Golden Gate Bridge." This tells us the feature is causally involved. It is not just a passive readout but an active direction that shapes what the model generates.

This is the same observational-to-causal progression that distinguishes activation patching from attention pattern analysis. Activation patterns tell us what exists. Interventions tell us what matters.

Three aspects of the Golden Gate Claude result are particularly important. First, clamping a single feature consistently modified behavior in the expected direction. This means SAE features are not just statistical artifacts but correspond to genuine causal directions in the model's computation. Second, the modification was coherent. The model did not produce random tokens or crash. It incorporated the clamped concept into fluent language. This suggests that SAE features interact cleanly with the rest of the model's processing. Third, the steering was targeted. Clamping the Golden Gate Bridge feature did not produce generic confusion or randomness. It produced specifically Golden-Gate-Bridge-themed content. The feature has a specific semantic meaning, and clamping it has a specific semantic effect.

<details class="pause-and-think">
<summary>Pause and think: From steering to safety</summary>

Golden Gate Claude was a playful demonstration, but imagine the same technique applied to a safety-relevant feature. If you could identify a "deception" feature and clamp it to zero, would that make the model unable to deceive? What if instead of clamping to zero, you clamped it to a high value -- could you create a model that always deceives? What are the risks and limitations of this approach to controlling model behavior?

</details>

## Safety-Relevant Features

Templeton et al. did not only find features for bridges and code bugs. They also found features related to behaviors that matter for AI safety {% cite "templeton2024scaling" %}:

- **Deception features:** Features that activate when the model generates deceptive or misleading content.
- **Sycophancy features:** Features that activate when the model agrees with the user regardless of accuracy.
- **Dangerous content features:** Features related to harmful instructions, bias, and unsafe outputs.

The existence of these features opens three potential applications, each at a different stage of maturity.

**Monitoring.** If we can identify safety-relevant features reliably, we could track their activations during deployment. Are deception features activating more than expected? Are sycophancy features firing when the model should be pushing back? Feature monitoring could provide a real-time "dashboard" of model behavior that complements traditional behavioral testing.{% sidenote "Feature monitoring for safety is analogous to physiological monitoring in medicine. Rather than waiting for symptoms (behavioral failures), you continuously track vital signs (feature activations). The key question is whether feature activations are reliable vital signs -- whether they are sensitive enough to catch problems and specific enough to avoid false alarms." %}

**Steering.** If features are causally relevant (as Golden Gate Claude demonstrates), we could amplify safety features or suppress dangerous ones during inference. This would supplement alignment techniques like RLHF with a mechanistic layer of control. Instead of training the model not to be deceptive (behavioral), we could directly suppress the deception feature (mechanistic).

**Auditing.** If features provide a complete and reliable decomposition of model behavior, we could build an "affirmative safety case" -- a positive argument that the model is safe, based on inspecting its internal representations rather than relying solely on the absence of observed failures.

These are promising directions, not accomplished facts. Critical open questions remain. Can monitoring features actually catch safety failures that behavioral testing misses? We do not know yet. Can feature steering replace or supplement RLHF? Clamping a single feature is crude, and real safety requires nuanced control across many features simultaneously. Is there a path to an affirmative safety case based on feature inspection? This requires features to be complete (capturing everything the model represents) and reliable (consistently firing for the concepts they represent) -- two properties that have not been established.

The limitations that apply to SAEs in general apply with special force to safety applications. If SAE features are not unique (different training runs produce different features), which features do we monitor? If features suffer from absorption (where parent features fail to fire for inputs that match child features), monitoring may miss important activations. If interpretability is partly illusory (features look interpretable but are not complete), safety conclusions may be unreliable.

## From Features to Circuits

The scaling monosemanticity results establish that SAE features are interpretable, causally relevant, and present at scale. But individual features alone are not circuits. Knowing that a "deception" feature exists does not tell us how the model decides to deceive, or what computations produce that decision.

To build full mechanistic understanding, we need to trace how features connect -- which features cause which other features, and how information flows through the network at the feature level rather than the head level. This is the domain of attribution graphs and circuit tracing, which build on SAE features as their basic vocabulary.

The progression mirrors what we saw with attention heads. First, we identified individual heads (Name Movers, S-Inhibition heads). Then, we traced connections between heads to discover circuits (the IOI circuit). SAE features are at the "identifying individual components" stage. The next step is connecting them into feature-level circuits.

Meanwhile, the SAE architecture itself has room for improvement. The vanilla L1-regularized SAE that produced these results has known biases, and newer architectures address those biases while maintaining the interpretability gains. Those improvements, along with an honest assessment of what SAEs still cannot do, are covered in the [next article on SAE variants and evaluation](/topics/sae-variants-and-evaluation/).
