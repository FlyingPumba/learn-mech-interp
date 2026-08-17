---
title: "Choosing Causal Mediators"
description: "Choosing neurons, heads, activation vectors, or learned subspaces as causal units, and matching their tradeoffs to the claim an experiment needs to support."
order: 2
prerequisites:
  - title: "Activation Patching and Causal Interventions"
    url: "/topics/activation-patching/"
glossary:
  - term: "Causal Mediator"
    definition: "An intermediate model component or learned feature treated as a causal unit between an input and an output, such as a neuron, attention head, activation vector, or subspace."
  - term: "Selectivity"
    definition: "The extent to which an intervention changes the target phenomenon while preserving other behaviors or attributes that the proposed mediator should not control."
---

## The Unit Changes the Claim

Suppose replacing the residual-stream vector after the token “Paris” makes a model answer *Asia* instead of *Europe*. The intervention establishes that the patched vector carries enough information to change the answer in that context. It does not establish that we found a continent feature. The same vector may also carry the city, country, language, token position, and details of the surrounding prompt.

We could patch a smaller unit instead: one neuron, one attention head, a direction through the residual stream, or a learned multidimensional subspace. Each choice asks a different causal question. A full vector is easy to locate and often produces a large effect, but it changes many variables together. A direction can be more specific, but finding it requires data and an estimation procedure that may introduce structure of its own.

> **Causal Mediator:** An intermediate component or learned feature treated as a causal link between an input and an output. The mediator defines what an intervention changes and therefore constrains what the result can explain.

Choosing a mediator is not a neutral implementation detail. It is the first modeling decision in a causal interpretability study {% cite "mueller2025mediator" %}.

## Three Different Goals

The right mediator depends on what we want from the study.

**Explaining model behavior** requires units that humans can describe and combine into an account. A sparse feature circuit may be useful even if it is harder to discover than a layer-level effect, because “this feature represents the requested language” says more than “layer 18 matters.”

**Verifying a mechanistic hypothesis** starts with proposed variables and asks whether interventions behave as that hypothesis predicts. If the hypothesis says a model separately computes two range checks, a multidimensional subspace aligned to each check can be appropriate even when neither subspace has a simple basis-aligned description. [Causal abstraction](/topics/causal-abstraction/) develops this use of interchange interventions and counterfactual faithfulness.

**Localizing and editing** can tolerate a mediator that is difficult to describe if intervening on it reliably changes the target and preserves everything else we care about. A layer or module may be enough to guide an edit, although editability does not prove that the original information was stored only there. [Localized fact editing](/topics/fact-editing/) shows how those claims can come apart.

<details class="pause-and-think">
<summary>Pause and think: Same model, different goal</summary>

You can either identify a single layer that strongly affects factual recall or learn a small subspace whose intervention changes one attribute. Which mediator would you choose to locate a cheap edit? Which would you choose to argue that the model represents the attribute separately from related attributes?

The layer is a reasonable starting point for a cheap edit because there are few layers to search. The subspace is better evidence for a separable representation, provided it passes off-target tests. Neither result establishes the other claim automatically.

</details>

## Common Mediator Types

Mediator types trade granularity against ease of search {% cite "mueller2025mediator" %}.

| Mediator | What an intervention changes | Main advantage | Main risk |
|---|---|---|---|
| Full layer or module vector | Every represented variable at that site | Few sites to enumerate; often high effect | Low selectivity and little human-readable structure |
| Attention head | One architectural component across positions | Native model unit with a bounded search space | A head can perform several functions or share work with others |
| Neuron | One basis-aligned scalar | Fine-grained and directly addressable | Polysemanticity and basis dependence |
| Group of components | A selected set of neurons, heads, or edges | Can capture distributed mechanisms | Combinatorial search and ambiguous grouping |
| Learned direction | One non-basis-aligned scalar feature | Often sparse and easy to manipulate | The search procedure can overfit the dataset |
| Learned subspace | Several coordinates representing one variable | Can express multidimensional variables | Requires supervision and a more complex alignment claim |
| Learned feature dictionary | Sparse combinations of directions | Proposes many candidate units without target labels | Reconstruction error, non-uniqueness, and incomplete feature recovery |

Coarse units generally preserve more of the original computation but entangle more causes. Fine learned units can isolate a target more precisely, while depending more heavily on training data, optimization, and the assumptions of the featurizer. No row dominates the others.

## Four Criteria for a Mediator

A mediator should be evaluated against four properties rather than by intervention effect alone {% cite "mueller2025mediator" %}.

**Faithfulness** asks whether the selected units preserve or predict the model behavior being explained. For a circuit, this can mean that retaining the proposed circuit reproduces the model’s output distribution. For a mechanistic hypothesis, it can mean that counterfactual interventions produce the predicted outputs.

**Sparsity** asks how much of the model the explanation uses. The whole network is perfectly faithful to itself, so faithfulness without a size constraint does not yield a useful decomposition. Sparsity can count neurons, heads, edges, dimensions, or another resource appropriate to the mediator.

**Generality** asks whether the account survives new inputs, templates, domains, and sometimes new models. A direction found on one prompt family may faithfully explain that family while representing a shortcut that disappears elsewhere.

**Selectivity** asks what the intervention leaves unchanged. If patching a proposed continent feature changes both continent and language, then the intervention has a causal effect but does not isolate continent. Selectivity must be tested against plausible neighboring variables; it cannot be inferred from a large target effect.

These criteria form tradeoffs rather than a single ranking. A full activation vector can be faithful and general but insufficiently sparse or selective. A one-dimensional direction can be sparse and selective on its training distribution but fail to generalize. Human understandability adds another requirement when the goal is explanation rather than localization.

## Cause and Isolate

RAVEL turns selectivity into two intervention scores {% cite "huang2024ravel" %}. Consider a feature proposed to represent the continent associated with a city.

- **Cause:** Patch the feature from a Tokyo source into “Paris is in the continent of”. The answer should change from *Europe* to *Asia*.
- **Isolate:** Apply the same patch to “People in Paris speak”. The answer should remain *French* rather than changing with Tokyo’s language.

A high Cause score with a low Isolate score means the intervention moves the target but also moves attributes that should have remained fixed. Full-vector patching is an instructive baseline because it carries all the information at the site and can therefore cause the desired answer for the wrong level of abstraction.

RAVEL’s Llama2-7B comparison found that counterfactually supervised subspace methods achieved stronger combined Cause and Isolate scores than the tested principal-component and sparse-autoencoder baselines. The result concerns those methods, model, attributes, and feature-selection procedures; it does not establish a universal ordering between supervised subspaces and every sparse autoencoder.

## A Practical Selection Procedure

Start by writing the claim before choosing the component.

1. **Name the target variable and neighboring variables.** “Factual recall” is too broad if the intended claim concerns country rather than language, city, or token identity.
2. **Choose the coarsest mediator that could still distinguish the claim.** Layer sweeps are useful for reconnaissance. They are rarely the final unit for an attribute-specific explanation.
3. **Separate discovery from evaluation.** If a direction is learned on labeled examples, test it on held-out entities, prompt templates, and counterfactual combinations.
4. **Measure both target and off-target effects.** Report Cause together with Isolate-style controls, not only the largest observed change.
5. **Compare another mediator type.** A neuron set, supervised direction, and full-vector baseline can reveal whether the conclusion depends on the chosen coordinate system.

Search methods and mediator types should also be reported separately. Activation patching can search over heads, neurons, layers, or learned features; sparse autoencoders define a feature basis but do not by themselves show which features cause a behavior.

## What the Choice Cannot Settle

Passing all four criteria on a benchmark supports a mediator relative to the tested distribution and alternatives. It does not show that the mediator is uniquely correct. Neural computations can admit several useful decompositions, and two units at different scales may both support valid claims.

Optimization creates an additional ambiguity for learned mediators. A supervised subspace can align cleanly with labels because the target information was already present, or because a flexible search procedure extracted a dataset-specific correlate. Held-out interventions and comparisons with simpler baselines reduce this ambiguity without eliminating it.

The preceding [activation-patching article](/topics/activation-patching/) develops two practical controls for these claims: testing what an intervention leaves alone and composing patches from multiple sources so that no source contains the final answer.
