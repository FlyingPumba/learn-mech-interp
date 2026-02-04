---
title: "Function Vectors"
description: "How in-context learning examples create natural directions in activation space that encode entire tasks, showing that models represent functions, not just features."
prerequisites:
  - title: "The Refusal Direction"
    url: "/topics/refusal-direction/"
difficulty: "advanced"
block: "representation-engineering"
category: "core-concepts"
---

## From Engineered to Natural Directions

So far, every steering vector we have encountered has been **engineered**: we chose contrasting prompts, ran them through the model, and computed the difference. [ActAdd](/topics/activation-engineering/) uses a single contrast pair. [CAA](/topics/activation-engineering/) averages over many pairs. The [refusal direction](/topics/refusal-direction/) used harmful versus harmless prompts. In every case, a human designed the contrastive stimuli.

But do models also develop **naturally occurring** directions that encode meaningful computations? Todd et al. (2024) discovered that they do {% cite "todd2024function" %}. Using causal mediation analysis on in-context learning tasks, they found directions in activation space that encode entire *tasks* -- not just concepts like "sentiment" or "refusal," but *functions* like "translate to French" or "return the antonym."

> **Function Vector:** A direction in activation space, extracted from in-context learning examples, that encodes the demonstrated task itself. Unlike engineered steering vectors (which encode concepts chosen by the researcher), function vectors arise naturally from the model's own in-context learning mechanism.

## What Function Vectors Are

Todd et al. applied causal mediation analysis to in-context learning (ICL). When a model processes few-shot examples like:

```
cat -> gato
dog -> perro
house -> ???
```

it learns to translate English to French from the examples. But *where* in the model is the task "translate to French" represented?{% sidenote "This connects back to the study of induction heads, which showed that specific attention heads implement the in-context learning mechanism. Function vectors extend this finding: induction heads create the *mechanism* for ICL, and function vectors are the *content* -- the representation of what task to perform." %}

The analysis revealed:

- A small number of attention heads transport a compact representation of the demonstrated task.
- This representation is a **function vector** -- a direction that encodes *what to do* (translate, capitalize, find antonyms), not just *what is present* (sentiment, topic, language).

Examples of tasks encoded as function vectors: "translate English to French," "convert uppercase to lowercase," "return the antonym," "extract the first letter."

## Robustness

Function vectors have a remarkable property: they **transfer** across different inputs and contexts.

Extract a function vector from in-context learning examples (e.g., three English-to-French translation pairs). Then inject that vector into a zero-shot setting -- a prompt with no examples at all. The model performs the task, triggered solely by the function vector.{% sidenote "This robustness result is surprising. The function vector was extracted from specific examples (cat/gato, dog/perro), yet it triggers the same function on entirely new inputs without any examples present. The vector encodes the *task itself*, not the specific input-output mappings." %}

The function vector encodes the abstract task, not the specific examples from which it was extracted. It generalizes across input formats and contexts that do not resemble the original ICL examples.

<details class="pause-and-think">
<summary>Pause and think: What function vectors tell us</summary>

Engineered steering vectors (ActAdd, CAA) encode concepts that humans chose. Function vectors encode tasks that the model learned to represent through in-context learning. What does the existence of function vectors tell us about how transformers organize information internally? And how does this connect to the linear representation hypothesis?

Function vectors suggest that the residual stream organizes not just *what is* (features, concepts) but *what to do* (tasks, computations) as linear directions. This extends the linear representation hypothesis from static properties to dynamic computations. If tasks are linear directions, then the residual stream is not just a feature space -- it is a space of both features and functions, all encoded as directions that can be read, added, and composed.

</details>

## Composability

Function vectors can be **summed** to create new composite tasks:

- "Translate to French" + "convert to uppercase" = "translate to French in uppercase"

This vector arithmetic for tasks is analogous to the semantic vector arithmetic that made word embeddings famous (king - man + woman = queen), but operating at a much higher level. Instead of composing *word meanings*, we are composing *computations*.

The composability of function vectors suggests that the model represents tasks in a space where linear combination is meaningful -- further evidence that the activation space has a rich, interpretable geometric structure.

<details class="pause-and-think">
<summary>Pause and think: Limits of composability</summary>

Function vectors for "translate to French" and "convert to uppercase" can be summed to get "translate to French in uppercase." But can you think of two tasks whose function vectors probably would *not* compose well? What properties of tasks make them composable or non-composable?

Tasks that operate on the same aspect of the output are likely to conflict rather than compose. For example, "translate to French" and "translate to German" both target the output language -- summing them would produce interference, not a meaningful composite. Similarly, tasks that require fundamentally different processing strategies (e.g., "summarize" and "elaborate") may not compose because they push the output in opposite directions. Composability works best for tasks that operate on orthogonal aspects of the output.

</details>

## The Connection to Steering

Function vectors extend the steering paradigm in an important way:

- **ActAdd/CAA steering vectors:** Engineered directions that modify behavior. The researcher chose the concept and designed the contrast pairs.
- **Function vectors:** Naturally occurring directions that encode tasks. The model learned them during in-context learning.

Both are directions in activation space. The difference is where they come from: human-specified contrast pairs versus the model's own learning mechanism.

This convergence is significant. It suggests that the residual stream naturally organizes task information as linear directions -- the same geometric structure that we exploit when we engineer steering vectors. The [linear representation hypothesis](/topics/linear-representation-hypothesis/) applies not just to the concepts we choose to probe, but to the computations the model learns to perform.

Together with [activation engineering](/topics/activation-engineering/), [representation engineering](/topics/representation-engineering/), the [refusal direction](/topics/refusal-direction/), and [concept erasure](/topics/concept-erasure/), function vectors complete the picture of Block 5: the residual stream is a linear space of both features and functions, all accessible through the geometric operations of reading, adding, and removing directions.

Where this block focused on reading and steering representations, the next block turns to the question of *computation*: for interpretable replacements of the opaque MLP layers that implement much of the transformer's processing, see [transcoders](/topics/transcoders/).
