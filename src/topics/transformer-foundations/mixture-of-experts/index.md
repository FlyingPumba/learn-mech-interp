---
title: "Mixture of Experts (MoE)"
description: "A sparse mixture of experts gives a transformer several feed-forward networks per layer. A learned router selects which ones process each token and weights their outputs."
order: 11
prerequisites:
  - title: "The Attention Mechanism"
    url: "/topics/attention-mechanism/"
  - title: "MLPs in Transformers"
    url: "/topics/mlps-in-transformers/"
glossary:
  - term: "Sparse Mixture of Experts (MoE)"
    definition: "A layer with several expert networks and a learned router that selects a subset to process each input. The layer combines the selected outputs into one update."
  - term: "Top-k Routing"
    definition: "A rule that selects the experts with the k highest router scores for a given input. The selected experts process that input, and their gate weights scale their outputs."
---

## Why give a layer several feed-forward networks?

Consider the last word in “We paddled to the bank” and “I deposited cash at the bank.” Attention can use the earlier words to build a different representation of “bank” in each sentence. In a dense transformer, the same [multilayer perceptron (MLP)](/topics/mlps-in-transformers/) processes both representations. Widening that MLP gives the model more parameters, but it also makes the matrix multiplications more expensive for every token.

A **mixture of experts (MoE)** gives the layer several MLPs, each with its own weights. A small learned network called the **router** reads the state at each position and selects which MLPs to run there. The idea of learning how to divide examples among networks goes back to Jacobs et al. {% cite "jacobs1991adaptive" %}. Shazeer et al. used a sparse router so they could add more expert networks while running only a few for each input {% cite "shazeer2017sparse" %}.

> In a **sparse mixture-of-experts layer**, only the selected experts process a given token. The layer combines their output vectors into a single update to the residual stream at that position.

An attention head can carry information from “paddled” to “bank.” The router can then use that information to select experts for “bank,” even if it selected different experts for “paddled.” At the next MoE layer, a new router makes another choice using the updated representation of each token.

## Follow one token through the router

Suppose a layer has four experts. For “bank” in the paddling example, imagine the router assigns them probabilities of 0.60, 0.15, 0.05, and 0.20, in order. With **top-2 routing**, only the two experts with the highest probabilities run. Here those are experts 1 and 4, and each receives the *entire* state at “bank.”

<figure>
  <img src="/topics/mixture-of-experts/images/top-two-routing.svg" width="600" height="456" alt="The router selects experts 1 and 4 for the token bank, with probabilities 0.60 and 0.20. They receive the same input and return vectors (0, 4) and (8, 0). With weights 0.75 and 0.25, their combined update is (2, 3).">
  <figcaption>In this example, both experts process the same token state. The router determines how much of each output vector to add to the residual stream. The numbers are illustrative.</figcaption>
</figure>

The diagram uses the weighting rule from Mixtral {% cite "jiang2024mixtral" %}. The selected probabilities sum to 0.80. Dividing each by 0.80 gives **gate weights** of 0.75 and 0.25. Think of each expert output as a proposed change to the residual stream. If expert 1 returns $(0,4)$ and expert 4 returns $(8,0)$, we can work out the residual update $\Delta\mathbf{r}$ at “bank.”

$$
\begin{aligned}
\Delta\mathbf{r} &= 0.75\,(0,4) + 0.25\,(8,0) \\
                 &= (0,3) + (2,0) \\
                 &= (2,3).
\end{aligned}
$$

Expert 4 gets only a quarter of the weight, yet it accounts for the entire change in the first coordinate. Its output has an 8 in that coordinate, while expert 1's output has a zero. To work out what either expert contributes, we need both its gate weight and the vector it produces for this input.

<details class="pause-and-think">
<summary>Suppose the router selects experts 1 and 4 with the same weights in both sentences. Must the update at “bank” be the same?</summary>

No. The MLPs receive a representation of “bank” that can depend on “paddled” in one sentence and “cash” in the other. The same experts can therefore produce different outputs even when their gate weights match.

</details>

## How does the router score each expert?

Let $\mathbf{x}$ be the input to the feed-forward sublayer at one position. In a transformer that normalizes before each sublayer, $\mathbf{x}$ is the normalized residual state after attention. A linear router learns one column of weights for each expert. For a state of width $d$ and $N$ experts, those columns form a $d \times N$ matrix $W_R$. Multiplying the row vector $\mathbf{x}$ by this matrix gives one score per expert.

$$
\mathbf{s} = \mathbf{x} W_R
$$

Entry $s_i$ is the dot product of the token state with column $i$. The router uses the same learned columns in both “bank” sentences. What changes with context is $\mathbf{x}$, so a different pair of experts can have the highest scores. No one has to assign an expert to riverbanks or financial institutions in advance.

Let $S$ contain the indices of the $k$ highest scores. Mixtral takes the softmax over just those scores {% cite "jiang2024mixtral" %}. This gives the same weights we calculated in the example, where we started with probabilities for all four experts and divided the two largest by their sum. The gate weight for a selected expert $i$ is

$$
g_i = \frac{\exp(s_i)}{\sum_{j \in S}\exp(s_j)}.
$$

Each selected MLP $E_i$ takes the same input $\mathbf{x}$ and returns a vector with one entry per residual-stream dimension. We multiply each output by its gate weight and add the results.

$$
\Delta\mathbf{r} = \sum_{i \in S} g_i E_i(\mathbf{x}).
$$

The router scores all $N$ experts, but only $k$ MLP outputs enter the sum. In the pre-normalized block above, we add $\Delta\mathbf{r}$ to the residual state from *before* normalization. Later attention heads can use the information the experts added at this position.

Suppose expert 1 has the highest score and experts 2 and 4 are nearly tied for second. A small change to $\mathbf{x}$ can switch which of those two MLPs runs. Their scores may be close even when their output vectors point in different directions. When comparing two prompts, recording the scores just above and below the cutoff shows how close the router was to selecting a different expert.

## What changes when we add more experts?

Suppose each of the four MLPs in the diagram contains a million parameters. The layer stores four million expert parameters and uses two million of them for “bank.” Now double the number of experts, keeping their width and $k=2$ fixed. The *total* number of expert parameters doubles to eight million. The number of *active* expert parameters per token stays at two million because we still evaluate just two MLPs. The router itself now has to score eight candidates.

In Mixtral 8×7B, each layer selects two of eight experts. Across the whole model, the authors report roughly 47 billion parameters in total and 13 billion active per token {% cite "jiang2024mixtral" %}. Multiplying eight by seven billion would count the shared attention weights eight times. Only the expert MLPs have eight separate sets of weights at each layer.

GShard kept a dense MLP in every other layer of its translation transformer. In the remaining layers, a router selected up to two experts per token {% cite "lepikhin2021gshard" %}. DeepSeekMoE uses narrower MLPs so it can select more experts for roughly the same amount of computation. It also includes **shared experts** that run for every token {% cite "dai2024deepseekmoe" %}. To reconstruct the feed-forward update in one of those layers, we would need the outputs of both the shared experts and the ones the router selected.

Each token uses only a few experts, but a batch of tokens can use all of them. To run an expert efficiently, we group the token states assigned to it and evaluate its MLP on the group. If the experts are on different devices, we have to send the states to those devices and send the outputs back {% cite "lepikhin2021gshard" %}. With more experts and the same batch size, each expert also gets fewer tokens on average. Smaller matrix multiplications and time spent transferring vectors can affect how fast the layer runs, even when the number of active parameters per token stays the same.

## How do the router and experts learn together?

In the “bank” example, the next-token prediction depends on the outputs of experts 1 and 4 and on how the router weights them. Backpropagating the prediction loss through that weighted sum lets us train both MLPs and the router. If putting a little more weight on expert 4's output would reduce the loss, the gradient favors increasing its score relative to expert 1's. Selecting the top two experts is a discrete choice, but as long as the same pair is selected, their gate weights vary smoothly with their scores {% cite "shazeer2017sparse" %}.

What happens if we select only one expert? A softmax over a single score always gives a weight of one, so changing that score a little would have no effect on the weight. Switch Transformer instead takes a softmax over **all** the experts and multiplies the selected expert's output by its probability {% cite "fedus2022switch" %}. In our four-expert example the layer would return $0.60\,(0,4)=(0,2.4)$. If the router raised expert 1's score while the other scores stayed fixed, its probability would rise above 0.60. That dependence lets the prediction loss train the router even though only one MLP runs.

If the router keeps selecting the same few experts, the others receive little training. Switch encourages more even use by adding a **load-balancing loss** during training {% cite "fedus2022switch" %}. For each expert, the penalty depends on the fraction of tokens assigned to it in the batch and the average probability the router gave it. Assigning more probability to an expert that already receives many tokens costs more. Because the loss is computed across a batch, the router can still strongly prefer one expert for a particular token.

<details class="pause-and-think">
<summary>A router assigns eight tokens to four experts. Each expert has two slots. Is there room for every token at its assigned expert?</summary>

Only if each expert gets exactly two tokens. Suppose the router sends four tokens to expert 1, two to expert 2, and one each to experts 3 and 4. Expert 1 has two more tokens than it can process. In the capacity-limited Switch implementation, those two tokens skip the expert update at this layer and continue through the residual connection. Increasing the capacity of each expert leaves room for uneven assignments, at the cost of reserving slots that may go unused. {% cite "fedus2022switch" %}

</details>

## What does a routing pattern tell us?

Look at the spaces before `self.experts`, `self.gate`, and `self.args` in the Mixtral figure below. Each color identifies the router's **first-choice expert** within a layer. In layer 0, the pink indentation on all three lines tells us the router selected the same expert each time. In layer 31, the indentation is consistently yellow. To work out how these choices affected the residual stream, we would also need the second expert, both gate weights, and both experts' output vectors.

<figure>
  <img src="/topics/mixture-of-experts/images/mixtral-code-routing.png" width="762" height="620" alt="The same lines of Python color-coded by Mixtral’s first-choice expert at layers 0 and 31. Before three consecutive assignments, the indentation is pink in layer 0 and yellow in layer 31. The tokens to its right have several colors.">
  <figcaption>First-choice routing on a Python excerpt. Colors identify experts within each layer. Cropped from Figure 8 of Jiang et al., <em>Mixtral of Experts</em>, with the first and last layer panels stacked for readability. {% cite "jiang2024mixtral" %} <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</figcaption>
</figure>

The Mixtral authors also compared routing across research papers, biomedical abstracts, and philosophy texts. At each of the three layers they examined, the router used the experts in similar proportions across all three domains {% cite "jiang2024mixtral" %}. Averaging over a whole document can hide preferences for recurring patterns like the indentation in the figure. And even when we know an expert processes indentation, that leaves open what its output helps predict. Different lines of code might continue with a deeper indent, a closing bracket, or a variable name.

Does the expert marked pink in layer 0 help the model predict `self` after the indentation? We could stop the prompt just before `self` and record the model's score for its first token. On a second pass, we could subtract the pink expert's weighted output at the final indentation token, keeping the other expert's contribution fixed. We would then let the later layers run and compare the two scores. Disabling the pink expert *before* routing would answer a different question. The third-ranked expert would take its place, and the router would recompute the weights for the new pair.

## Looking Ahead

If removing the expert's output lowers the score for `self`, we have evidence that the expert helped predict it on this line. To explain how, we would need to work out what information the expert added at the indentation and how later layers used it to predict `self`. The next article explores [what makes an explanation mechanistic](/topics/what-is-mech-interp/).
