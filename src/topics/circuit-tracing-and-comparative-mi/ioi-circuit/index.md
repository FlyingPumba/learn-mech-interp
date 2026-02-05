---
title: "The IOI Circuit: Discovery and Mechanism"
description: "How researchers reverse-engineered the complete algorithm GPT-2 Small uses for indirect object identification, discovering five classes of attention heads working in concert."
order: 2
prerequisites:
  - title: "Attribution Patching and Path Patching"
    url: "/topics/attribution-patching/"

glossary:
  - term: "Circuit (neural)"
    definition: "A subgraph of a neural network consisting of specific components (attention heads, MLP neurons, or features) and their connections that together implement an identifiable computational mechanism."
  - term: "IOI Circuit"
    definition: "The circuit discovered in GPT-2 Small that performs the Indirect Object Identification task, consisting of name movers, backup name movers, S-inhibition heads, induction-like heads, and duplicate token heads working together to predict the correct indirect object."
  - term: "Name Mover Head"
    definition: "An attention head in the IOI circuit that attends to the indirect object name and copies it to the final token position, directly promoting that name in the output logits. Name movers are the output stage of the IOI circuit."
---

## The Task

Consider the sentence: "When Mary and John went to the store, John gave a drink to ___." A human reader immediately fills in the blank with "Mary." The reasoning is straightforward: John is the recently repeated subject, so the indirect object -- the person receiving the drink -- must be the other name, Mary.

This task is called **Indirect Object Identification** (IOI). It is simple enough that humans solve it effortlessly, yet rich enough that solving it requires tracking which names appear where, detecting which name is duplicated, and outputting the remaining name. Wang et al. set out to answer a deceptively deep question: how does GPT-2 Small (a 117M-parameter transformer) solve this task? Not whether it can -- it clearly can, with high reliability across many prompt variations -- but what algorithm it implements internally {% cite "wang2022ioi" %}.

> **Indirect Object Identification (IOI):** Given a sentence of the form "When [Name A] and [Name B] went to the store, [Name B] gave a drink to ___", the model must predict Name A -- the name that is NOT the recently repeated subject. Name A is the indirect object (IO). Name B is the subject (S).

What makes IOI a good benchmark for circuit analysis? The correct answer is unambiguous for every prompt. The clean/corrupted setup is natural: swap which name is the subject ("When Mary and John went to the store, Mary gave a drink to ___" flips the correct answer to John). And the metric is clean: the logit difference $\text{logit}(\text{IO}) - \text{logit}(\text{S})$ captures performance in a single continuous value. These properties made IOI the ideal target for what became the most complete circuit analysis ever performed on a production-scale model.{% sidenote "Wang et al. tested IOI across a large set of template variations -- different sentence structures, different name pairs, different verb phrases. The model consistently performs the task, suggesting the circuit is robust across the prompt distribution, not memorized for specific examples." %}

## The Human-Readable Algorithm

Before looking inside the model, consider how a simple algorithm might solve IOI:

1. **Identify all names** in the sentence (Mary, John)
2. **Detect which name is duplicated** (John appears at positions S1 and S2)
3. **Suppress the duplicated name** from the set of candidates
4. **Output the remaining name** (Mary)

Remarkably, GPT-2 Small implements something very close to this algorithm. The circuit uses 26 attention heads organized into functional classes, each implementing one step of the process. The algorithm was not designed by any human -- it emerged from gradient descent during training. Yet it follows a logical structure that humans can follow step by step.

This is the key framing for understanding the IOI circuit. It is not a list of 26 important heads. It is an **algorithm**: detect the duplicate, suppress it, output the remainder. The heads are the mechanism that implements the algorithm.

## The Discovery Methodology

How did Wang et al. find this circuit? They did not examine all 144 attention heads at random. Instead, they used a **backward-tracing** strategy, starting from the model's output and following the causal chain backward toward the input.{% sidenote "Backward tracing is more efficient than forward tracing because the output is sparse -- only a few heads directly contribute to the logit difference -- while the input is dense, with many heads processing information that may or may not be relevant to IOI. Starting from the sparse end narrows the search immediately." %}

**Step 1: Direct Logit Attribution.** Each attention head writes a vector to the residual stream at the final token position. Projecting each head's output through the unembedding matrix measures its direct contribution to the logit difference:

$$
\text{DLA}(\text{head } h) = (\mathbf{x}_h \cdot W_U)_{\text{IO}} - (\mathbf{x}_h \cdot W_U)_{\text{S}}
$$

This identifies heads whose outputs directly push toward predicting the indirect object.

**Step 2: Activation patching to confirm.** DLA shows correlation (which heads contribute to the logit). [Activation patching](/topics/activation-patching/) confirms causation by measuring what happens when each head's output is replaced between clean and corrupted runs. Heads with large DLA and large patching effects are the output stage of the circuit.

**Step 3: Trace upstream.** Once the output heads are identified, the question becomes: what determines their behavior? An attention head's output depends on its OV circuit (what information it copies, from its values) and its QK circuit (where it attends, from its queries and keys). [Path patching](/topics/attribution-patching/) reveals which upstream heads modify the queries and keys of the output heads.

**Step 4: Iterate.** The process repeats for each newly discovered head class. Trace what feeds into it, identify the functional role, and continue backward until reaching the input embeddings. The entire circuit was built by iterating this trace-backward procedure.

## Name Mover Heads: The Output Stage

The first heads discovered are the **Name Mover Heads**, located in layers 9-10. They are the output stage of the circuit.

Name Movers attend to a name token in the context and copy that name to the output logits via their OV circuit. In mathematical terms:

$$
\mathbf{x}_{\text{NM}} = A_{\text{NM}} \cdot X \cdot W_{\text{OV}}^{\text{NM}}
$$

where $A_{\text{NM}}$ is the attention pattern and $W_{\text{OV}}^{\text{NM}}$ maps name embeddings to name logits. The OV circuit implements an approximate "copy" operation for name tokens.

Name Movers were found first because they are closest to the output. Each one independently recovers 30-40% of the logit difference when patched (denoising direction), and their OV matrices are specialized for copying names.

But there is a subtlety. Without any input from upstream heads, Name Movers attend to *all* name tokens roughly equally. If Mary and John both appear in the sentence, a Name Mover would by default attend to both, producing roughly equal logits for each -- not helpful. Something must bias their attention toward the indirect object and away from the subject.

*Who modifies the Name Mover queries?* This question leads to the heart of the circuit.

## S-Inhibition Heads: The Key Mechanism

**S-Inhibition Heads** in layers 7-8 are the bridge between detection and output -- the heart of the IOI circuit.

S-Inhibition Heads are active at the END position (where the model produces its prediction). They attend to the S2 position (the second mention of the repeated name). Their function is to modify the queries of downstream Name Mover Heads so that Name Movers attend away from the duplicated name.

The mechanism works through the residual stream. S-Inhibition Heads write to the residual stream at the END position. Name Mover Heads read their queries from the same residual stream. The S-Inhibition output shifts the query vector so that the Name Mover's QK dot product with the duplicated name decreases:

$$
\mathbf{q}_{\text{NM}} = \mathbf{x}_{\text{END}} + \mathbf{x}_{\text{S-Inh}} + \ldots
$$

The term $\mathbf{x}_{\text{S-Inh}}$ acts as a negative signal for the duplicated name positions. The result: Name Movers attend preferentially to the IO position and copy Mary (not John) to the output.

Without S-Inhibition Heads, Name Movers attend to all names equally and the model cannot distinguish IO from S. Without Name Movers, the inhibition signal has no downstream consumer. S-Inhibition Heads translate "this name is duplicated" into "do not output this name."

Path patching confirmed this specific connection: ablating the path from S-Inhibition Heads to the queries of Name Mover Heads causes Name Mover attention to become uniform across names. They lose their IO preference, and the logit difference drops.{% sidenote "The path patching experiment is precise: it does not ablate the S-Inhibition Heads' entire output, only the component that flows into Name Mover queries. This isolates the specific mechanism (query modification) from other potential effects of S-Inhibition outputs." %}

<details class="pause-and-think">
<summary>Pause and think: Why S-Inhibition works at the END position</summary>

S-Inhibition Heads operate at the END position (the final token where the prediction is made), even though the duplicated name appears much earlier in the sentence at positions S1 and S2. Why does this architectural arrangement make sense?

The Name Movers need to read their queries at the END position, because that is where the model produces its prediction. For S-Inhibition to modify Name Mover queries, it must write to the residual stream at the same position the Name Movers read from -- the END position. If S-Inhibition wrote to the S2 position instead, the Name Movers (which read queries at END) would never see the inhibition signal. The circuit's spatial layout follows the functional requirement: information about the duplicate must reach the prediction site.

</details>

## Duplicate Token Heads and Induction Heads: The Detection Stage

For S-Inhibition to suppress the right name, the model must first detect *which* name is duplicated. This is the job of the detection stage in layers 0-6.

**Duplicate Token Heads** (layers 0-1) solve the detection problem directly. These heads are active at position S2 and attend back to position S1. Their QK circuit implements approximate token matching: when the token at S2 equals the token at S1, the attention weight is high:

$$
A(\text{S2}, \text{S1}) \propto \exp(\mathbf{x}_{\text{S2}} \cdot W_{\text{QK}} \cdot \mathbf{x}_{\text{S1}}^T)
$$

When S2 and S1 are the same token, the query-key dot product is large because the same embedding appears on both sides. The head writes information about the duplicate into the residual stream at S2, signaling: "this token has appeared before."

**Induction Heads** (layers 5-6) complement the Duplicate Token Heads. Recall from [the discussion of induction heads](/topics/induction-heads/) that these heads implement the pattern "[A][B] ... [A] -> predict [B]." In the IOI context, they use K-composition with Previous Token Heads (also layers 0-1) to recognize the repeated name pattern and strengthen the signal.

By layer 6, the model has a strong representation of which name is duplicated, written into the residual stream. This signal propagates to S-Inhibition Heads, which read it and use it to suppress the duplicate at the output.{% sidenote "The composition between Duplicate Token Heads, Previous Token Heads, and Induction Heads is technically intricate. The key point is that multiple heads in the early layers collaborate to produce a single clear signal -- 'John is the repeated name' -- that the later stages of the circuit consume. The details of the composition are less important than the functional outcome." %}

## The Three-Step Algorithm

The full core mechanism:

1. **Detect** (layers 0-6): Duplicate Token Heads and Induction Heads identify that "John" at position S2 matches "John" at position S1.
2. **Suppress** (layers 7-8): S-Inhibition Heads, active at the END position, attend to S2 and write a suppression vector that modifies Name Mover queries.
3. **Output** (layers 9-10): Name Mover Heads, with their queries now biased away from John's positions, attend preferentially to Mary and copy her name to the output logits.

The information flows through the model in this order:

Input tokens -> Previous Token + Duplicate Token Heads (L0-1) -> Induction Heads (L5-6) -> S-Inhibition Heads (L7-8) -> Name Mover Heads (L9-10) -> Output: "Mary"

This is a compositional algorithm. Each head class has a well-defined function that feeds into the next. The mechanism is causal -- each link was verified through patching experiments, not just correlation. And the algorithm was not designed by any human; it emerged from training.

<details class="pause-and-think">
<summary>Pause and think: Why a compositional algorithm?</summary>

The IOI algorithm decomposes into detect-suppress-output. Consider an alternative: the model could learn to directly memorize "if John appears twice, output Mary." Why is the compositional three-step algorithm a better solution?

Memorization would require the model to store a lookup table for every possible name pair. With hundreds of common English names, the number of pairs is enormous. The compositional algorithm is name-independent: it detects *which* name is duplicated (regardless of the specific name), suppresses *that* name (whatever it is), and outputs *the other one*. This generalizes across all name pairs using the same small set of heads, making it far more parameter-efficient than memorization.

</details>

## From 144 Heads to 26

GPT-2 Small has 144 attention heads. Only 26 participate in the IOI circuit -- roughly 18% of the model's attention capacity. This sparsity supports the circuits hypothesis: models implement specific behaviors using identifiable subsets of their parameters, with the remaining components serving other tasks and other circuits.

But the core algorithm described above uses only four of the seven head classes Wang et al. identified. The full circuit also contains **Negative Name Mover Heads**, **Backup Name Mover Heads**, and **Previous Token Heads** -- components that reveal surprising properties of neural network circuits, including loss hedging and built-in redundancy. For the complete circuit, including these additional head classes and the criteria for evaluating whether a circuit account is correct, continue to [Circuit Evaluation: Faithfulness, Completeness, and Minimality](/topics/circuit-evaluation/).
