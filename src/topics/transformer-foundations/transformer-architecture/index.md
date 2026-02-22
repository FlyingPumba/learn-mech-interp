---
title: "Transformer Architecture Intro"
description: "A guided walkthrough of the full transformer stack: embeddings, attention, MLPs, layer norm, residual stream, and positional information."
order: 2
prerequisites:
  - title: "Prerequisites"
    url: "/topics/mi-prerequisites/"
---

## What Does an LLM Actually Do?

At the highest level, a language model takes text as input and outputs a probability distribution over what token comes next. Feed it "the cat sat on the" and it assigns probabilities to possible continuations: "mat" might get 15%, "floor" 12%, "bed" 8%, and so on.{% sidenote "The model doesn't see words directly. Text first goes through a tokenizer, which we'll discuss shortly." %}

The architecture inside that does this computation is called a **transformer** {% cite "vaswani2017attention" %}. Despite all the improvements since the original 2017 paper, the core architecture has remained remarkably stable. The differences between GPT-2 (2019) and modern frontier models are mostly about scale: more layers, more parameters, more training data. The fundamental building blocks are the same.

### Why Next-Token Prediction Might Mean Understanding

Consider GPT-2 Small: the model weights are about half a gigabyte, but it was trained on roughly 150 GB of text. The model is much smaller than its training data, yet it can reasonably predict the next token across that entire corpus. It cannot simply be memorizing all those gigabytes, since it lacks the capacity.

If you took a collection of math textbooks, erased all the proofs, and someone could fill in the blanks reasonably well, you would not say they are merely memorizing. They must have internalized something about how mathematics works.

The same logic applies here: a model that can compress a much larger dataset into reasonable predictions must have developed some internal representation of language structure, facts, and patterns. Compression, in some sense, *is* understanding. You may find this claim debatable, but it motivates why we might expect interesting structure inside these models.

## Tokenization: Text to Numbers

Neural networks operate on numbers, not strings. Before any computation, text passes through a **tokenizer**, which converts it into a sequence of integers called tokens.

The tokenizer is constructed before training (using compression techniques like Byte-Pair Encoding) and remains fixed. For common English words, each word typically becomes one token. For rare words, foreign text, or gibberish, the tokenizer breaks them into smaller pieces.{% sidenote "You can explore how different models tokenize text at tools like <a href=\"https://platform.openai.com/tokenizer\" target=\"_blank\" rel=\"noopener\">OpenAI's tokenizer playground</a>. It's worth getting an intuition for how common words become single tokens while rare words fragment into multiple pieces." %}

For example, with GPT-2's tokenizer:
- "The quick brown fox" becomes 4 tokens (one per word, with spaces attached)
- An uncommon word like "gimble" might become two tokens: "g" and "imble"
- Keyboard mashing produces many tokens, roughly one per character pair

Two tokenization details matter for interpretability work. First, most tokenizers prepend a special **beginning-of-sequence (BOS) token** to every input. This token appears at position 0 in every sequence, which makes it a fixed landmark. Attention heads that have nothing useful to attend to often default to the BOS position, using it as a "rest position." This produces a characteristic vertical stripe (column pattern) in attention visualizations: many positions attending to position 0. When you see this pattern, it usually does not mean the BOS token contains meaningful information. It means those heads are effectively idle on that input.{% sidenote "Some models (like GPT-2) do not use a dedicated BOS token but exhibit the same column-pattern behavior on whatever token happens to be at position 0. The principle is the same: a fixed, predictable position serves as a default attention target." %}

Second, most tokenizers are sensitive to leading whitespace. The token for " cat" (with a space prefix) is a different token from "cat" (no space). In normal text, most words appear with a preceding space, so " cat" is the common form. This distinction trips up many MI experiments: if you manually construct prompts or look up token IDs, forgetting the space prefix gives you the wrong token. Tools like TransformerLens provide helper methods to handle this correctly.

For the rest of this article, we will take tokenization as a black box and focus on what happens once we have our sequence of token IDs.

## The Big Picture

A decoder-only transformer processes a sequence by repeatedly applying two sublayers at every layer:

1. **Attention:** move information between positions.
2. **MLP:** transform information at each position.

Both sublayers write their outputs into a shared **residual stream**, which acts like a global scratchpad.

<figure>
  <img src="/topics/transformer-architecture/images/transformer_high_level.png" alt="High-level transformer architecture overview.">
  <figcaption>High-level transformer architecture overview, from Elhage et al., <em>A Mathematical Framework for Transformer Circuits</em>. {% cite "elhage2021mathematical" %}</figcaption>
</figure>

### Parallel Predictions

Here is a crucial insight about how transformers process sequences: given an input of $n$ tokens, the model makes $n$ predictions simultaneously. Each position predicts what token comes next at that position, conditioned only on tokens at earlier positions.{% sidenote "This is enforced by causal masking in the attention mechanism. Position i can only attend to positions 0 through i, never to the future." %}

During training, a single sequence becomes $n$ training examples. Position 0 predicts token 1 given no context. Position 1 predicts token 2 given token 0. Position $n-1$ predicts token $n$ given all previous tokens. The model adjusts its weights to make each of these predictions slightly better.

This parallel structure is why transformers are so efficient to train compared to earlier architectures like RNNs, which had to process tokens sequentially. RNNs compute a hidden state that depends on all previous hidden states, so computing the output at position $n$ requires $n$ sequential steps. Transformers sidestep this: attention lets every position look at every earlier position in a single parallel operation. This parallelism is a major reason transformers have become dominant.

## Step 0: Tokens to Vectors

Once we have our sequence of token IDs, we need to convert them into vectors that the neural network can process. Each token becomes a vector through two lookups:

$$
\mathbf{r}^0 = \text{Embed}(\text{tokens}) + \text{PE}
$$

- **Token Embedding:** A learned lookup table maps each token ID to a high-dimensional vector. Tokens with similar meanings or usage patterns tend to end up with similar embedding vectors, though this is entirely learned from data.
- **Positional Encoding (PE):** Since attention is otherwise permutation-invariant (swapping token positions would not change the computation), we add positional information. This can be learned embeddings (a lookup table indexed by position) or fixed sinusoidal patterns. The model uses this to know that "cat sat" differs from "sat cat".

## Step 1: Attention (Information Routing)

Attention is the mechanism that allows tokens to communicate with each other. Each position can look at all previous positions, decide which are relevant, and gather information from them.

The core idea: every token plays three roles simultaneously:
- **Query:** "What am I looking for?"
- **Key:** "What do I contain?"
- **Value:** "What information do I send if attended to?"

Each token's query is compared against every other token's key (via dot product) to produce attention weights. These weights determine how much each token contributes to the output. The final output is a weighted sum of value vectors.

$$
\mathbf{r}^{l+} = \mathbf{r}^l + \text{Attn}^l(\mathbf{r}^l)
$$

Multi-head attention runs several attention heads in parallel, each with its own learned query/key/value projections. Different heads can attend to different things: one might look at the previous token, another at the subject of the sentence, another at tokens matching some learned pattern.

For the full mathematical details of attention, including the softmax normalization, scaling, and causal masking, see [The Attention Mechanism](/topics/attention-mechanism/).

## Step 2: MLP (Local Computation)

After attention, each position passes through an MLP (multi-layer perceptron). Unlike attention, the MLP operates independently on each position: it does no cross-token communication.

$$
\mathbf{r}^{l+1} = \mathbf{r}^{l+} + \text{MLP}^l(\mathbf{r}^{l+})
$$

The MLP typically has a hidden layer that is 4x wider than the residual stream dimension, with a nonlinear activation function (often GELU) in between. Think of it as: attention moves information between positions, then the MLP processes that information within each position.

Current evidence suggests MLPs store factual associations and apply nonlinear transformations that attention cannot. They may function as key-value memories where patterns in the input trigger retrieval of associated information.

## The Residual Stream

The residual stream is the central information highway of the transformer. Every component reads from it and writes back to it additively:

$$
\mathbf{r}^L = \mathbf{r}^0 + \sum_{l=0}^{L-1} \left(\text{Attn}^l + \text{MLP}^l\right)
$$

This additive structure has a profound consequence: the final output is a sum of contributions from every component. We can decompose it and ask: how much did attention head 3 in layer 5 contribute to predicting "cat"? This is the foundation of mechanistic interpretability techniques like direct logit attribution.

Interestingly, if you take the residual stream halfway through the model and apply the unembedding matrix directly, you do not get nonsense. You get a rough approximation of the model's final prediction. The residual stream gradually refines its representation layer by layer, and this gradual refinement is what makes interventions on intermediate layers meaningful.

Components communicate only through the residual stream. Attention head 3 in layer 5 has no direct wire to MLP 2 in layer 7. Instead, head 3 writes to the residual stream, and MLP 2 reads from it. This shared-bus architecture is what makes the transformer amenable to mechanistic analysis.

## Layer Normalization

Layer normalization appears before each sublayer and is essential for stable training. Without it, activations grow unboundedly across layers and gradients explode. We cover layer normalization in detail in [Layer Normalization](/topics/layer-normalization/), including the pre-norm vs. post-norm distinction, RMSNorm, and why it introduces a nonlinearity that matters for mechanistic interpretability.

## The Full Stack (Compact Form)

For clarity, this recurrence omits [layer normalization](/topics/layer-normalization/), which is applied before each sublayer in practice. A decoder-only transformer applies this recurrence for each layer $l$:

$$
\mathbf{r}^{l+1} = \mathbf{r}^l + \text{Attn}^l(\mathbf{r}^l) + \text{MLP}^l(\mathbf{r}^l)
$$

After $L$ layers, the final residual stream is mapped to logits:

$$
\text{Logits} = \mathbf{r}^L \cdot W_U
$$

where $W_U$ is the unembedding matrix. The logits are then passed through softmax to get a probability distribution over the vocabulary.

## Training: Making Loss Go Down

Training a language model is conceptually simple: show the model text, have it predict the next token at every position, and adjust weights to make correct predictions more likely.

For a sequence of tokens $(t_0, t_1, \ldots, t_n)$, the model predicts a probability distribution at each position. We measure how wrong these predictions are using **cross-entropy loss**: the negative log probability assigned to the actual next token.

$$
\mathcal{L} = -\frac{1}{n}\sum_{i=0}^{n-1} \log P(t_{i+1} | t_0, \ldots, t_i)
$$

If the model assigns 50% probability to the correct next token, the loss contribution is $-\log(0.5) \approx 0.69$. If it assigns 99% probability, the loss is only $-\log(0.99) \approx 0.01$. Training via gradient descent tweaks all the weights (embeddings, attention parameters, MLP weights, unembedding) to make the loss a little lower.

Every part of the transformer is learned: which embedding vectors to use, what attention patterns to form, what the MLPs compute. If it makes sense for "cat" and "feline" to have similar embeddings (because they predict similar next tokens), the model will learn that from data.

## Generating Text

Once trained, the model produces a probability distribution over next tokens. Choosing a token from that distribution and repeating the process produces text. The choice of decoding strategy (greedy, temperature-scaled, nucleus sampling, beam search) affects quality and diversity. We cover these in [Decoding Strategies](/topics/decoding-strategies/).

The generation loop feeds the full sequence back through the model at each step. The model has no memory between steps: each forward pass is independent, and the model does not know which tokens it generated versus which were in the original prompt.

## Why This Matters for MI

Mechanistic interpretability treats the model as a computation graph we can open. Because the transformer's core operations are structured and mostly linear in the residual stream, we can trace, ablate, and patch individual components.

The additive residual stream means we can decompose the output into contributions from each component. The parallel structure of attention means we can study individual heads in isolation. The fact that everything is learned means the model may have discovered interpretable algorithms we can reverse-engineer.

The rest of this course builds on this architecture-level understanding, developing tools to answer questions like: Which head is responsible for this prediction? What information is stored where? How do components compose to implement complex behaviors?
