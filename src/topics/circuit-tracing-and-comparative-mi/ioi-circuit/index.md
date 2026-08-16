---
title: "The IOI Circuit: Discovery and Mechanism"
description: "How researchers traced a compact attention-head circuit that helps GPT-2 Small solve indirect object identification, from duplicate detection to name copying."
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

Consider the sentence: "When Mary and John went to the store, John gave a drink to ___." A human reader immediately fills in the blank with "Mary." The reasoning is straightforward: John is the recently repeated subject, so the indirect object, the person receiving the drink, must be the other name, Mary.

This task is called **Indirect Object Identification** (IOI). It is simple enough that humans solve it effortlessly, yet rich enough that solving it requires tracking which names appear where, detecting which name is duplicated, and outputting the remaining name. Wang et al. set out to answer a deceptively deep question: how does GPT-2 Small (a 117M-parameter transformer) solve this task? Not whether it can, it clearly can, with high reliability across many prompt variations, but what algorithm it implements internally {% cite "wang2022ioi" %}.

> **Indirect Object Identification (IOI):** Given “When [Name A] and [Name B] went to the store, [Name B] gave a drink to ___,” the target is Name A, the indirect object rather than the repeated subject.

What makes IOI a good benchmark for circuit analysis? The correct answer is unambiguous for every prompt. The clean/corrupted setup is natural: swap which name is the subject ("When Mary and John went to the store, Mary gave a drink to ___" flips the correct answer to John). And the metric is clean: the logit difference $\text{logit}(\text{IO}) - \text{logit}(\text{S})$ captures performance in a single continuous value. These properties made IOI a tractable target for a detailed circuit analysis.{% sidenote "Wang et al. tested IOI across a set of template variations, different sentence structures, name pairs, and verb phrases. Performance across that distribution helps rule out memorization of a single template, though it does not establish the same mechanism on unrestricted text." %}

## The Human-Readable Algorithm

Before looking inside the model, consider how a simple algorithm might solve IOI:

1. **Identify all names** in the sentence (Mary, John)
2. **Detect which name is duplicated** (John appears at positions S1 and S2)
3. **Suppress the duplicated name** from the set of candidates
4. **Output the remaining name** (Mary)

The circuit analysis suggests that GPT-2 Small implements something close to this algorithm. Researchers grouped 26 attention heads into functional classes that contribute at different stages. The resulting account is human-readable, even though the weights themselves emerged through training rather than being programmed by hand.

The IOI circuit is not merely a list of 26 important heads. Its proposed **algorithm** detects the duplicate, suppresses it, and outputs the remaining name; the circuit maps each step to the heads that implement it.

## The Discovery Methodology

How did Wang et al. find this circuit? They did not examine all 144 attention heads at random. Instead, they used a **backward-tracing** strategy, starting from the model's output and following the causal chain backward toward the input.{% sidenote "Backward tracing is more efficient than forward tracing because the output is sparse, only a few heads directly contribute to the logit difference, while the input is dense, with many heads processing information that may or may not be relevant to IOI. Starting from the sparse end narrows the search immediately." %}

**Step 1: Direct Logit Attribution.** Each attention head writes a vector to the residual stream at the final token position. Projecting each head's output through the unembedding matrix measures its direct contribution to the logit difference:

$$
\text{DLA}(\text{head } h) = (\mathbf{x}_h \cdot W_U)_{\text{IO}} - (\mathbf{x}_h \cdot W_U)_{\text{S}}
$$

This identifies heads whose outputs directly push toward predicting the indirect object.

**Step 2: Test candidates with activation patching.** DLA shows which heads contribute directly to the chosen logit difference. [Activation patching](/topics/activation-patching/) tests whether replacing a head's output between clean and corrupted runs changes that metric. Heads with large effects become candidates for the circuit's output stage.

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

But there is a subtlety. Without any input from upstream heads, Name Movers attend to *all* name tokens roughly equally. If Mary and John both appear in the sentence, a Name Mover would by default attend to both, producing roughly equal logits for each, not helpful. Something must bias their attention toward the indirect object and away from the subject.

*Who modifies the Name Mover queries?* This question leads to the heart of the circuit.

## S-Inhibition Heads: The Key Mechanism

**S-Inhibition Heads** in layers 7-8 are the bridge between detection and output, the heart of the IOI circuit.

S-Inhibition Heads are active at the END position (where the model produces its prediction). They attend to the S2 position (the second mention of the repeated name). Their function is to modify the queries of downstream Name Mover Heads so that Name Movers attend away from the duplicated name.

The mechanism works through the residual stream. S-Inhibition Heads write at the END position, and Name Mover Heads form their queries from the updated state. With a row-vector convention:

$$
\mathbf{r}'_{\text{END}} = \mathbf{r}_{\text{END}} + \mathbf{x}_{\text{S-Inh}} + \ldots,
\qquad
\mathbf{q}_{\text{NM}} = \mathbf{r}'_{\text{END}} W_Q^{\text{NM}}
$$

The term $\mathbf{x}_{\text{S-Inh}}$ acts as a negative signal for the duplicated name positions. The result: Name Movers attend preferentially to the IO position and copy Mary (not John) to the output.

Under the reported interventions, removing S-Inhibition makes Name Mover attention less selective between the candidate names, while removing Name Movers eliminates a major direct copying path. This supports the summary that S-Inhibition converts duplicate-name information into a query update that discourages copying that name.

Path patching supports this specific connection: intervening on the path from S-Inhibition Heads to the queries of Name Mover Heads makes Name Mover attention less selective between names, and the logit difference drops.{% sidenote "Path patching targets the proposed route into Name Mover queries rather than replacing the S-Inhibition Heads' entire output. This is more specific than whole-head ablation, although it still tests the mechanism under an intervention rather than observing the untouched computation directly." %}

<details class="pause-and-think">
<summary>Pause and think: Why S-Inhibition works at the END position</summary>

S-Inhibition Heads operate at the END position (the final token where the prediction is made), even though the duplicated name appears much earlier in the sentence at positions S1 and S2. Why does this architectural arrangement make sense?

Name Movers construct their queries at the END position, where the next-token prediction is made. S-Inhibition can modify those queries by writing at the same position. A write confined to S2 would not directly enter the END-position query, so information about the duplicate must first reach the prediction site.

</details>

## Duplicate Token Heads and Induction Heads: The Detection Stage

For S-Inhibition to suppress the right name, the model must first detect *which* name is duplicated. This is the job of the detection stage in layers 0-6.

**Duplicate Token Heads** (layers 0-1) solve the detection problem directly. These heads are active at position S2 and attend back to position S1. Their QK circuit implements approximate token matching: when the token at S2 equals the token at S1, the attention weight is high:

$$
A(\text{S2}, \text{S1}) \propto \exp(\mathbf{x}_{\text{S2}} \cdot W_{\text{QK}} \cdot \mathbf{x}_{\text{S1}}^T)
$$

When S2 and S1 are the same token, the query-key dot product is large because the same embedding appears on both sides. The head writes information about the duplicate into the residual stream at S2, signaling: "this token has appeared before."

**Induction Heads** (layers 5-6) complement the Duplicate Token Heads. Recall from [the discussion of induction heads](/topics/induction-heads/) that these heads implement the pattern "[A][B] ... [A] -> predict [B]." In the IOI context, they use K-composition with Previous Token Heads (also layers 0-1) to recognize the repeated name pattern and strengthen the signal.

By layer 6, the model has a strong representation of which name is duplicated, written into the residual stream. This signal propagates to S-Inhibition Heads, which read it and use it to suppress the duplicate at the output.{% sidenote "The composition between Duplicate Token Heads, Previous Token Heads, and Induction Heads is technically intricate. The key point is that multiple heads in the early layers collaborate to produce a single clear signal, 'John is the repeated name', that the later stages of the circuit consume. The details of the composition are less important than the functional outcome." %}

## The Three-Step Algorithm

The full core mechanism:

1. **Detect** (layers 0-6): Duplicate Token Heads and Induction Heads identify that "John" at position S2 matches "John" at position S1.
2. **Suppress** (layers 7-8): S-Inhibition Heads, active at the END position, attend to S2 and write a suppression vector that modifies Name Mover queries.
3. **Output** (layers 9-10): Name Mover Heads, with their queries now biased away from John's positions, attend preferentially to Mary and copy her name to the output logits.

The information flows through the model in this order:

Input tokens -> Previous Token + Duplicate Token Heads (L0-1) -> Induction Heads (L5-6) -> S-Inhibition Heads (L7-8) -> Name Mover Heads (L9-10) -> Output: "Mary"

This gives a compositional account: each head class has a proposed function that feeds into the next. Patching experiments provide causal evidence for important links, while the remaining approximation error and prompt dependence keep the account from being a literal line-by-line program.

<details class="pause-and-think">
<summary>Pause and think: Why a compositional algorithm?</summary>

The IOI algorithm decomposes into detect-suppress-output. Consider an alternative: the model could learn to directly memorize "if John appears twice, output Mary." Why is the compositional three-step algorithm a better solution?

A lookup table over name pairs would grow with the number of names and transfer poorly to unfamiliar examples. The proposed circuit instead reuses the same operations: detect *which* name is duplicated, suppress *that* name, and copy *the other one*. Testing new names and templates helps distinguish this reusable procedure from narrow memorization.

</details>

## From 144 Heads to 26

GPT-2 Small has 144 attention heads, and the proposed IOI circuit contains 26 of them. That does not mean the task uses exactly 18% of the model's total capacity: heads share the residual stream, and MLPs and other heads can still affect the computation. It does show that much of the benchmark behavior can be traced through a comparatively small set of components.

The core algorithm above uses only four of the seven head classes Wang et al. reported. Their expanded circuit also contains **Negative Name Mover Heads**, **Backup Name Mover Heads**, and **Previous Token Heads**. These components expose effects that a simple feed-forward story misses, including suppression and redundancy. Negative Name Movers connect to the broader [copy suppression](/topics/copy-suppression/) pattern, while Backup Name Movers illustrate [self-repair](/topics/self-repair/) after ablation. The next article, [Circuit Evaluation: Faithfulness, Completeness, and Minimality](/topics/circuit-evaluation/), uses these additional classes to ask how much confidence the proposed circuit deserves.
