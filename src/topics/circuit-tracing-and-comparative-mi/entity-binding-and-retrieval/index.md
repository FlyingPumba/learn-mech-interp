---
title: "Entity Binding and Retrieval"
description: "How language models associate entities with attributes in context, attach reusable binding identifiers, and retrieve the right value through several competing mechanisms."
order: 4
prerequisites:
  - title: "The IOI Circuit: Discovery and Mechanism"
    url: "/topics/ioi-circuit/"
  - title: "The Attention Mechanism"
    url: "/topics/attention-mechanism/"
glossary:
  - term: "Entity Binding"
    definition: "The problem of associating an entity with its context-specific attributes so that the correct pair can be retrieved later without confusing it with other entities."
  - term: "Binding ID"
    definition: "A context-specific identifier represented by corresponding entity-side and attribute-side vectors, allowing later computation to retrieve values by matching the pair."
---

## The Binding Problem

Consider the context “Pete loves jam, and Ann loves pie,” followed by “Ann loves”. Predicting *pie* requires more than representing the four content words. The model must preserve which person goes with which food. If it represented only a bag of entities and attributes, *jam* and *pie* would be equally available.

This is the **binding problem**: how can a distributed representation associate several variables with their current values without confusing the pairs? The problem appears whenever a model tracks people and properties, objects and locations, variables and values, or characters and beliefs.

> **Entity Binding:** Associating an entity with its context-specific attributes so that later computation can retrieve the correct pair rather than merely detect that both items occurred.

The [IOI circuit](/topics/ioi-circuit/) solves a related reference problem by detecting a duplicated name, suppressing it, and copying the other name. Binding research asks a broader representational question: what internal code lets a model distinguish several entity–attribute pairs, and how does the model dereference that code later? These accounts should not be collapsed into one mechanism because they were established on different models, tasks, and intervention sites.

## Content Plus an Identifier

Feng and Steinhardt found evidence for a **binding ID mechanism** across the sufficiently large Pythia and LLaMA models they tested {% cite "feng2024binding" %}. An entity representation contains information about the entity itself plus a context-specific identifier. Its associated attribute receives a matching identifier.

For entity $e_i$ and attribute $a_i$, a simplified decomposition is

$$
\mathbf{h}(e_i) \approx \mathbf{c}_E(e_i) + \mathbf{b}^E_i,
\qquad
\mathbf{h}(a_i) \approx \mathbf{c}_A(a_i) + \mathbf{b}^A_i,
$$

where $\mathbf{c}$ carries content and $\mathbf{b}^E_i,\mathbf{b}^A_i$ are the entity-side and attribute-side vectors corresponding to abstract binding ID $i$. The same ID does not permanently belong to Ann or pie. It is assigned by the current context, much like a temporary variable name.

> **Binding ID:** A temporary abstract identifier represented by corresponding entity-side and attribute-side vectors. Matching identifiers allow retrieval without requiring the pair to occupy fixed absolute positions.

The proposal is not that the equations reconstruct every activation exactly. They describe the component manipulated by the paper’s causal interventions: replacing or moving the inferred binding component changes which content is retrieved while preserving much of the content representation.

## Two Causal Predictions

Binding IDs imply two tests that distinguish them from copying an entire entity–attribute representation {% cite "feng2024binding" %}.

**Factorizability** means entity and attribute content can be replaced separately. Replace the attribute activation at slot $i$ with the activation from slot $i$ in another context, and entity $i$ should become bound to the new attribute while the other pairs remain intact. This first test moves content and its slot-specific identifier together; finer interventions later change the inferred identifier while preserving content.

**Position independence** means retrieval follows the identifier rather than a fixed slot. Permuting entity and attribute representations while preserving the matching IDs should preserve the associations. A mechanism that stores “the second person maps to the second food” would fail this test when positions are rearranged.

The tested interventions support both predictions in the studied models. They provide stronger evidence than a probe that merely decodes the correct pair, because they alter the proposed binding variable and check the resulting association.

<details class="pause-and-think">
<summary>Pause and think: Content or binding?</summary>

Suppose replacing Ann’s full activation with Pete’s makes the model answer *jam*. Why does this fail to establish a binding-ID mechanism?

The replacement moves Pete’s identity, attributes, position-dependent information, and any binding code together. A binding-ID test must change which pieces are associated while preserving their content, such as attaching Ann’s identifier to the representation of jam.

</details>

## A Continuous Binding Space

The inferred IDs do not behave like a small set of discrete one-hot labels. Linear interpolations between valid binding vectors often still produce usable identifiers, whereas random vectors with comparable scale usually do not {% cite "feng2024binding" %}. Nearby identifiers are also harder for the model to distinguish than distant ones.

This behavior supports a continuous binding subspace with meaningful distances. A context can assign different points in that space to different pairs, and retrieval succeeds when the points are separated enough for downstream computation to tell them apart. The geometry also predicts a capacity failure: packing more entities into the same usable region makes collisions or near-collisions more likely.

The evidence is broad across the tested model families but not unrestricted. The experiments use controlled binding tasks, and “every sufficiently large tested model” is a statement about a finite set of Pythia and LLaMA checkpoints, not all transformer language models.

## Binding Is Not Yet Retrieval

Attaching identifiers explains how pairs can be represented, but the model still needs to recover the requested entity or attribute. Later work finds that models combine several retrieval routes rather than relying on one universal pointer {% cite "gurarieh2026mixing" %}.

**Positional retrieval** uses a pair’s ordering or contextual slot. It works well for short lists but becomes noisy as lists grow, especially for items in middle positions.

**Lexical retrieval** uses the bound counterpart as a cue. If the question asks who loves pie, the representation of *pie* helps retrieve *Ann*. This route depends on content rather than only the pair’s ordinal position.

**Reflexive retrieval** follows a more direct pointer from one representation to its partner. It supplies another route when positional information is unreliable.

Across nine models and ten binding tasks, a causal model combining the three mechanisms matched the models’ next-token distributions at about 95% agreement and generalized to longer contexts interleaved with unrelated text {% cite "gurarieh2026mixing" %}. The mixture changes with task and position, so observing a positional mechanism in a short synthetic list does not establish that the same route dominates in longer text.

## Lookbacks for Belief Tracking

Belief tracking adds another layer to the binding problem. A story can describe where an object really is, what one character saw, and what another character falsely believes. Answering a question about the second character requires retrieving the state associated with that character’s information rather than the latest state in the story.

Prakash et al. identify **lookback mechanisms** in which low-rank ordering identifiers are colocated in state-token representations {% cite "prakash2025lookbacks" %}. A binding lookback retrieves the state identifier associated with the requested character and object. An answer lookback then retrieves the corresponding state token. When the story explicitly describes who can see whom, a visibility lookback updates the relevant belief before the final retrieval.

The mechanism composes several pointer-like operations:

1. Identify the character and object named by the question.
2. Retrieve the state identifier bound to that pair.
3. Incorporate visibility information when the story requires it.
4. Retrieve the token associated with the resulting state.

This account concerns controlled Theory of Mind stories in the studied model, not unrestricted evidence that language models possess human-like theories of mind. Its contribution is a causal proposal for how a particular state-tracking computation is implemented.

## Capacity, Redundancy, and Alternative Accounts

Binding mechanisms fail in structured ways. Positional retrieval weakens with list length and in middle positions, while lexical and reflexive routes can compensate. A behavioral answer alone therefore underdetermines the mechanism: the same correct token may be supported by different mixtures of retrieval paths.

Interventions must also distinguish a binding variable from correlated content. Moving a full residual vector can transplant the answer itself. A stronger experiment changes an identifier while leaving content fixed, combines evidence from sources that do not contain the final answer, or predicts failures when identifiers become crowded.

Entity binding supplies a reusable level between individual attention heads and complete task behavior. [Circuit tracing](/topics/circuit-tracing/) can ask which components create, transport, and dereference the identifiers, while [universality studies](/topics/universality/) can test whether the same representational strategy recurs across architectures and training regimes.
