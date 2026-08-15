---
title: "TransformerLens"
description: "A practical guide to TransformerLens: named hook points, activation caches, weight access, interventions, and the tradeoffs of reimplementing model architectures."
order: 1
prerequisites:
  - title: "What is Interpretability?"
    url: "/topics/what-is-mech-interp/"
  - title: "Composition and Virtual Heads"
    url: "/topics/composition-and-virtual-heads/"

glossary:
  - term: "HookPoint"
    definition: "A named location in a TransformerLens model where activations can be intercepted, read, or modified during a forward pass. Every intermediate computation (attention patterns, residual stream states, MLP outputs) has a corresponding HookPoint."
  - term: "Activation Cache"
    definition: "A dictionary storing all intermediate activations from a model's forward pass, keyed by HookPoint name. Enables post-hoc inspection of every computation the model performed on a given input."
---

## Why a Dedicated Library?

Mechanistic interpretability requires more than a standard deep learning framework. We need to peer inside models during inference: read the residual stream at every layer, inspect attention patterns for every head, and intervene on activations mid-forward-pass to test causal hypotheses. Standard PyTorch models do not expose these internals in a convenient way. You can register hooks manually, but doing so for dozens of components across dozens of layers quickly becomes unwieldy.

**TransformerLens** solves this by providing a clean, purpose-built interface for MI research. It wraps transformer language models with hooks at every intermediate computation, letting researchers focus on interpretability questions rather than engineering boilerplate.

## History

TransformerLens was created by **Neel Nanda** in 2022, originally under the name **EasyTransformer**. It provided a consistent interface for loading transformer models and exposing computations that ordinary inference APIs hide. The project was later renamed **TransformerLens** and is maintained as an open-source library.

TransformerLens is widely used in mechanistic-interpretability tutorials and research code. Names such as `hook_resid_pre` and `blocks.0.attn.W_Q` recur often enough that learning the vocabulary makes many implementations easier to read, though other libraries expose models through different abstractions.

## Design Philosophy

TransformerLens reimplements transformer architectures from scratch rather than wrapping HuggingFace models directly. This is a deliberate choice with important tradeoffs.

**Why reimplement?** Production-oriented model implementations often fuse operations or hide intermediate values. TransformerLens separates the query, key, and value projections; the attention pattern; the value-weighted sum; and the residual stream around each component. Named **HookPoints** let you read or modify these activations.{% sidenote "TransformerLens converts pretrained weights into its own forward pass. Researchers should check output agreement with the reference implementation for the exact model, precision, and configuration they use; operation ordering and unsupported details can create discrepancies." %}

**The tradeoff.** Every new model architecture must be manually added to TransformerLens. When Meta releases a new Llama variant or Google releases a new Gemma version, someone needs to write the conversion code. This creates a lag between model release and TransformerLens support, and limits coverage to architectures that the community has prioritized. We will see in the [next article](/topics/nnsight-and-nnterp/) how nnsight and nnterp take a different approach to this problem.

## Core Abstractions

TransformerLens is built around three key abstractions that make MI research practical.

### HookPoints

A **HookPoint** is a named location in the model where you can intercept activations. Every intermediate computation has one: after each attention head, after each MLP, at each residual stream state, and more. HookPoints are named with a consistent scheme:

| HookPoint Name | What It Captures |
|---|---|
| `hook_embed` | Token embeddings |
| `blocks.{L}.hook_resid_pre` | Residual stream before layer L |
| `blocks.{L}.attn.hook_pattern` | Attention patterns at layer L |
| `blocks.{L}.attn.hook_result` | Output of all attention heads at layer L |
| `blocks.{L}.hook_mlp_out` | MLP output at layer L |
| `blocks.{L}.hook_resid_post` | Residual stream after layer L |

This naming convention has become the shared vocabulary of the MI community. When a paper refers to "the residual stream at layer 6," in code that is `cache["blocks.6.hook_resid_pre"]`.

### The Activation Cache

The activation cache is a dictionary that stores every intermediate activation from a single forward pass. You fill it with one call:

```python
logits, cache = model.run_with_cache(tokens)
```

After this, `cache` contains every HookPoint's activation. You can inspect the attention pattern of head 3 in layer 5:

```python
pattern = cache["blocks.5.attn.hook_pattern"][:, 3]  # [batch, dest, src]
```

Or read the residual stream at layer 8:

```python
resid = cache["blocks.8.hook_resid_pre"]  # [batch, pos, d_model]
```

The cache makes exploratory analysis fast. Run a forward pass once, then poke around the internals without rerunning the model.{% sidenote "Caching every activation consumes memory proportional to model size times sequence length. For large models or long sequences, you can selectively cache only the HookPoints you need by passing a filter function to run_with_cache." %}

### Hooks for Intervention

Reading activations is observational. To test causal hypotheses, we need to *intervene*: modify an activation and see what changes. TransformerLens supports this through hook functions that fire during a forward pass.

A hook function receives the activation at a HookPoint and returns a (possibly modified) activation. For example, to zero out head 3 in layer 5:

```python
def zero_head_hook(activation, hook):
    activation[:, :, 3, :] = 0  # zero out head 3
    return activation

model.run_with_hooks(
    tokens,
    fwd_hooks=[("blocks.5.attn.hook_result", zero_head_hook)]
)
```

This is how researchers perform [activation patching](/topics/activation-patching/): replace one component's activation with its value from a different input, and measure the effect on the output. The hook interface makes it straightforward to implement patching, ablation, and [steering](/topics/addition-steering/) experiments.

## Weight Matrices

TransformerLens exposes model weights with a consistent naming scheme that maps directly to the mathematical framework from [QK/OV circuits](/topics/qk-ov-circuits/):

| Weight Name | Meaning |
|---|---|
| `blocks.{L}.attn.W_Q` | Query projection, layer L |
| `blocks.{L}.attn.W_K` | Key projection, layer L |
| `blocks.{L}.attn.W_V` | Value projection, layer L |
| `blocks.{L}.attn.W_O` | Output projection, layer L |
| `blocks.{L}.mlp.W_in` | MLP input weights, layer L |
| `blocks.{L}.mlp.W_out` | MLP output weights, layer L |
| `embed.W_E` | Token embedding matrix |
| `unembed.W_U` | Unembedding matrix |

These names make it easy to compute the composed QK and OV matrices that the circuit analysis framework relies on. For example, the full OV circuit for head $h$ at layer $L$ is `W_V[L, h] @ W_O[L, h]`, and you can compute it directly from the named parameters.

## Supported Models

TransformerLens supports a wide range of transformer language models, with pretrained weights loaded automatically from HuggingFace. The most commonly used models in MI research include:

- **GPT-2** (Small, Medium, Large, XL): The workhorse of MI research. Small enough to run on a single GPU, well-studied, and the subject of most foundational MI papers.
- **Pythia** (70M to 12B): EleutherAI's suite of models trained on The Pile with checkpoints saved throughout training, enabling the study of how circuits form during training.
- **Gemma / Gemma 2**: Google DeepMind's open models, used extensively with Gemma Scope SAEs.
- **Llama 2/3**: Meta's open models. Larger and more capable, useful for testing whether findings from small models generalize.
- **GPT-Neo / GPT-J / GPT-NeoX**: EleutherAI models of various sizes.

Model coverage changes as architectures are added. Before planning an experiment, check the library's current supported-model list and verify that the relevant architectural details survive conversion.

<details class="pause-and-think">
<summary>Pause and think: Cache vs. hooks</summary>

When would you use `run_with_cache` versus `run_with_hooks`? Consider the difference between observational analysis (understanding what the model computes) and causal analysis (testing what happens when you change something). The cache is for observation: run the model normally and inspect everything afterward. Hooks are for intervention: modify the computation as it happens. Many MI workflows start with cache-based exploration to identify interesting components, then switch to hook-based intervention to test causal hypotheses.

</details>

## A Minimal Example

To give a concrete sense of how TransformerLens works in practice, here is how you would load a model, run a prompt, and inspect which token the model predicts:

```python
import transformer_lens as tl

model = tl.HookedTransformer.from_pretrained("gpt2-small")
logits, cache = model.run_with_cache("The Eiffel Tower is in")

# What does the model predict for the next token?
predicted_token = logits[0, -1].argmax()
print(model.to_string(predicted_token))  # " Paris"

# Which attention heads at the last layer attended to "Eiffel"?
pattern = cache["blocks.11.attn.hook_pattern"][0, :, -1, :]  # all heads, last position
```

From this starting point, you can investigate how the “Paris” prediction developed: which heads routed relevant information, which MLP outputs directly supported the logit, and how intermediate residual states decoded under a chosen lens. Combining these observations with interventions is the [direct logit attribution](/topics/direct-logit-attribution/) and [logit lens](/topics/logit-lens-and-tuned-lens/) workflow from earlier articles.

<details class="pause-and-think">
<summary>Pause and think: Limitations of reimplementation</summary>

TransformerLens reimplements models from scratch rather than wrapping HuggingFace directly. What problems might this cause? Consider: (1) a researcher finds an interesting behavior in a TransformerLens model, how confident can they be it also occurs in the original HuggingFace model? (2) a new model architecture is released, how quickly can researchers study it? These are real tradeoffs. The [next article](/topics/nnsight-and-nnterp/) covers tools that take a different approach.

</details>

## Looking Ahead

TransformerLens lowers the engineering cost of MI experiments through named HookPoints, activation caches, and intervention hooks. Its conventions also provide a common vocabulary across many tutorials and codebases.

But the reimplementation approach has limits. New architectures require manual porting, and the gap between TransformerLens's internal representation and the original model weights can occasionally matter. The [next article](/topics/nnsight-and-nnterp/) introduces nnsight and nnterp, which take a complementary approach: working directly with HuggingFace models while providing standardized access to their internals.
