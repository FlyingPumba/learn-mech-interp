---
title: "Looped Transformers"
description: "A looped transformer applies the same layers several times before predicting a token. Each pass can use what the previous pass found to decide where to look next."
order: 12
prerequisites:
  - title: "Transformer Architecture Intro"
    url: "/topics/transformer-architecture/"
  - title: "The Attention Mechanism"
    url: "/topics/attention-mechanism/"
glossary:
  - term: "Looped Transformer"
    definition: "A transformer that applies a shared layer or group of layers repeatedly to hidden states at the same token positions. Each pass can use information computed by the preceding pass."
  - term: "Recurrent Depth"
    definition: "Depth obtained by applying the same learned transformation in successive steps. The number of steps determines how many times the transformation runs."
---

## Following two links before predicting a token

Suppose a timetable lists **Bay → Elm**, **Fir → Ash**, and **Oak → Bay**, in that order. The question is “Which station is two stops from Oak?” We have to find Oak's destination before we know which connection to look up next. A language model could write “Oak goes to Bay” and use the word it just generated to look up Bay. Could it do both lookups before it writes the first word of its answer?

Imagine an [attention head](/topics/attention-mechanism/) that looks up whichever station is represented at the end of the question. The first time it runs, it looks up Oak and retrieves Bay. Suppose the layer writes that result into the state at the question position. If we apply the same layer again, the head now looks up Bay and retrieves Elm. Throughout both lookups the prompt ends in “Oak?” Only the hidden states have changed.

> A **looped transformer** applies a shared layer or group of layers repeatedly at the same token positions. Each pass receives information from the previous pass. The resulting sequence of updates gives the model **recurrent depth**.

How could one head read two different entries with the same weights? Suppose earlier layers have encoded each connection at its destination word. At “Bay” in “Oak → Bay,” the attention **key** identifies Oak and the **value** carries Bay. At “Elm” in “Bay → Elm,” the key identifies Bay and the value carries Elm. In the figure, read across each row to see which entry matches the current query. The arrow between rows shows how the value retrieved on the first pass supplies the query for the second.

<figure>
  <img src="/topics/looped-transformers/images/two-stop-lookup.svg" width="560" height="272" alt="Two passes of one attention head over the same three train connections. A query for Oak reads the third connection and retrieves Bay. A query for Bay then reads the first connection and retrieves Elm.">
  <figcaption>The highlighted cell shows which prompt entry supplies the value on each pass. The query and the retrieved station are labels for information carried by vectors. Only the final answer, Elm, needs to be written as text.</figcaption>
</figure>

At the question position, the first pass must change which station the head will look up. At the timetable positions, it must preserve enough information to answer that lookup. If the entries are erased when the first pass ends, the head can form a query for Bay but has nowhere to find its destination.

## What repeats when we unroll the loop?

In an ordinary two-layer transformer, the second layer has its own attention and feed-forward weights. In the simplest looped version, we call the first layer twice. Writing out those calls in the order they run is called **unrolling** the loop. Let $H^{(0)}$ contain the states entering the loop, one row per token position, and let $B_\theta$ be the block with learned weights $\theta$. Two passes give us

$$
\begin{aligned}
H^{(1)} &= B_\theta(H^{(0)}), \\
H^{(2)} &= B_\theta(H^{(1)}).
\end{aligned}
$$

The same $\theta$ appears on both lines. What changes is the input to the block. In the train example, the row for the question carries Oak in $H^{(0)}$, Bay in $H^{(1)}$, and Elm in $H^{(2)}$. The other rows can also change. When a decoder first reads the prompt, it can update all positions in parallel within a pass. Causal attention still restricts each position to reading itself and earlier positions. The two passes have to run in order because the second one reads $H^{(1)}$. After the last pass, the decoder uses the state at the final position to score the possible next tokens.

If the model writes “Bay” in a **chain of thought**, it adds a token that later positions can attend to. In the looped lookup, Bay is a **latent** intermediate result. The second pass can use it because the vector at the question position now encodes Bay. A looped language model can use both forms of computation together, running several passes before each token of a written explanation.

Weight sharing also couples what the two passes learn. When we backpropagate through this unrolled computation, both calls contribute to the gradient of $\theta$. An adjustment that helps the head retrieve Bay on the first pass also changes the weights it uses to retrieve Elm on the second. If the block needs to behave differently on successive passes, it can infer which pass it is on from its inputs, or we can give it that information explicitly. The Universal Transformer, for example, encodes both a token's position and the current step {% cite "dehghani2019universal" %}.

<details class="pause-and-think">
<summary>Suppose we run the block twice but feed it the identical initial states both times. In the two-stop example, which station does the second call retrieve?</summary>

Bay again, assuming deterministic computation and no step signal. The second call has the same Oak query and reads the same entry. To reach Elm by this route, information about Bay must reach the input to the second lookup.

</details>

## Depth, parameters, and the cost of another pass

Suppose we want a token to go through six layers of computation. We could train a stack of six layers, each with its own weights, or train one layer that runs six times. The first design can learn a different operation at each layer. The second does roughly the same amount of work per token while storing just one layer's weights.

When does the extra depth help, and how much does it matter that each layer has its own weights? We can separate those questions on a task like the timetable lookup. Saunshi et al. trained models to follow 32 links in a sequence of 256 letters {% cite "saunshi2025latent" %}. Reading down the first two rows, we hold the number of stored layers fixed. Reading down the last two, we hold the depth fixed.

| Stored layers × passes | Accuracy |
| --- | ---: |
| 1 layer × 1 pass | 49.0% |
| 1 layer × 6 passes | 99.5% |
| 6 layers × 1 pass | 99.6% |

On this task, the one-layer model trained with six passes reached 99.5% accuracy, nearly matching the 99.6% of the six-layer stack. How could six passes suffice for 32 hops? In our timetable example, the head did one lookup at a time at the question position. A transformer can also update the positions it will read later. If an entry already records where two links lead, a single read of that entry can cover two hops.

With weights chosen by hand, we can see exactly how far this parallel work can go. Saunshi et al. constructed a block that solves their lookup task in a number of passes growing logarithmically with the hop count {% cite "saunshi2025latent" %}. A shared block can even execute a program supplied in the input. In a construction by Giannou et al., each pass reads an instruction and updates the state that subsequent instructions can use {% cite "giannou2023looped" %}. For the trained model in the table, accuracy tells us that six passes sufficed. Finding out what each pass computed requires looking inside it.

The weights are only part of what a decoder stores when it generates text. To avoid recomputing attention keys and values for past tokens, it usually keeps them in a cache. A token can enter the same layer with a different state on its second visit, so its second set of keys and values can differ from its first. Keeping both lets later tokens read the keys and values from the corresponding pass. Reusing one set across passes saves cache space and changes what the head can retrieve {% cite "geiping2025recurrent" %}.

## Which states reach the next pass?

To look up Bay on the second pass, the head needs both the station it just found and the original timetable. In our simple loop, the block has to carry both forward in its output. We could ease that burden by giving every pass a direct connection to the processed prompt. Then the block could retrieve a new station on each pass while keeping the same timetable available for the next lookup.

The Inkling 2 Mini language model, for example, runs its first six decoder layers once and makes their output available on every pass. These six layers form the **prelude**. The middle twelve layers run three times, and the final six run once {% cite "thinkingmachines2026inklingcard" %}. In the figure, trace the two arrows entering pass two. The arrow from the left carries the same prelude output that pass one received. The arrow from above carries what pass one computed.

<figure>
  <img src="/topics/looped-transformers/images/inkling-pass-routing.svg" width="540" height="444" alt="The prelude feeds all three passes. Each pass runs layers 7–12 first, then layers 13–18. On the first two passes, both blocks contribute to a gated message for the next pass. After pass three, layers 19–24 run once.">
  <figcaption>Inside each green row, “7–12 → 13–18” shows the order within one pass. Layers 7–12 run first, followed by layers 13–18. The two six-layer blocks are shown separately because both contribute to the gated message that the purple arrow carries to the next pass. The prelude feeds all three passes directly. Original diagram based on Thinking Machines Lab's description of Inkling 2 Mini. {% cite "thinkingmachines2026inkling" %}</figcaption>
</figure>

The two middle blocks each contribute their output to the **message** that reaches the next pass. Within a pass, each layer uses attention over block outputs to combine the information available to it. A learned gate controls how much the previous pass's message contributes {% cite "thinkingmachines2026inkling" %}. When the authors introduced looping during training, they set the gate to block the message. As the gate opened, pass two gained access to pass one's work while keeping its direct connection to the prompt.

Following one token down the diagram gives $6 + 3 \times 12 + 6 = 48$ layer applications from 24 stored layers. We can also look at the route *within* one of those layers. On each visit to layer 7, a [mixture-of-experts router](/topics/mixture-of-experts/) reads the token's current state and selects eight of 128 feed-forward experts {% cite "thinkingmachines2026inklingcard" %}. The token can therefore use different experts on its three visits, even though the number of visits is fixed in the [released Inkling 2 Mini checkpoint](https://huggingface.co/thinkingmachines/Inkling-2-Mini).

## Who decides how many passes to run?

Suppose we want to give the model more passes on a long lookup than on a short one. If we always stop training examples after exactly three passes, the final layers only practice reading the state at that depth. One way to make the pass count adjustable is to vary it during training. For example, Geiping et al. trained Huginn, a 3.5-billion-parameter language model, by sampling how many times to run its middle block {% cite "geiping2025recurrent" %}. Each pass reads both the current state and the prelude output. Because the final layers learn to read states produced at several depths, we can choose a pass count at inference and see which tasks benefit from the extra work.

On HellaSwag, where the model chooses a plausible continuation of a passage, eight passes brought Huginn close to its best score. Its accuracy on math word problems continued to improve at higher pass counts {% cite "geiping2025recurrent" %}. To test whether extra passes help with a chain of lookups, Thinking Machines used a separate research model that ran one to five passes during part of its training. Giving it more passes let it follow longer chains of table lookups, with gains out to ten passes. Across a broader set of tasks requiring a direct answer, the gains largely leveled off after three {% cite "thinkingmachines2026inkling" %}.

## Can different tokens stop at different depths?

When we set a single pass count for the whole prompt, every position receives another update, including positions that already carry the information later layers need. We can instead let a router choose how much computation to spend on each token. In the **token-choice** variant of Mixture-of-Recursions, the router reads each token's state before it enters the loop and assigns it a depth {% cite "bae2025recursions" %}. Follow a blue token from the bottom of the figure. It runs the shared block twice and then leaves the loop, while a red token goes through the same block a third time.

<figure>
  <img src="/topics/looped-transformers/images/token-choice-routing.png" width="840" height="495" alt="A router assigns the nine tokens at the bottom to stacks of one, two, or three loops. Purple tokens take one pass, blue tokens take two, and red tokens take three.">
  <figcaption>The choices above the router are three depths for the same shared block. Each colored square below it is one token. Figure 2(b) from Bae et al., <em>Mixture-of-Recursions</em>. {% cite "bae2025recursions" %} <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</figcaption>
</figure>

Choosing a depth up front means the router has to decide about pass three before it sees what pass two produces. A model can also decide *after each pass* whether a token needs another update. In the adaptive Universal Transformer, a learned halting signal accumulates at each position. Once that position halts, the model carries its state forward while the others continue {% cite "dehghani2019universal" %}. In Ouro, a gate estimates the probability of stopping on this pass given that the token has reached it. The model combines those estimates across passes and can exit when the cumulative probability of stopping exceeds a chosen threshold {% cite "zhu2025ouro" %}. An exit gate determines *whether the token runs through the block again*. Inkling's message gate determines *how much of the previous result the block reads* on each of its two later passes.

## Did the second pass use the first lookup?

Suppose a trained model answers Elm on our original timetable. How could we tell whether it used Bay as an intermediate result? Because the head's weights are shared, disabling it by changing its weights would affect both lookups at once. Unrolling gives us a way to intervene more precisely. We can record the head's attention pattern and output on each visit, then change the state that one pass hands to the next.

Consider a second timetable. Change **Oak → Bay** to **Oak → Fir**, and change **Fir → Ash** to **Fir → Yew**. The two-stop answer is now Yew. Save the state at the question position after pass one on this timetable. Now run the original prompt and substitute the saved state at the same position after the same pass. Every timetable entry in this run still comes from the original prompt.

<details class="pause-and-think">
<summary>If pass one supplies the departure station for pass two, what answer should we get after the swap?</summary>

The transplanted state asks for Fir. The original timetable says “Fir → Ash,” so pass two should retrieve Ash. This differs from both the original answer (Elm) and the second timetable's answer (Yew). A shift toward Ash would support the idea that the first pass supplies a station for the second pass to look up. Simply copying the second timetable's final answer would favor Yew instead.

</details>

The timetable swap is an [activation patching](/topics/activation-patching/) experiment. It tests whether the next pass *uses* the intermediate station. We might also ask whether we could *read* the station name from the state after pass one. That would be convenient, but the state only has to supply a query that matches the right timetable entry. A vector that queries for Bay need never make “Bay” the highest-scoring output word.

We can see the difficulty of reading intermediate steps in experiments on arithmetic. Lu et al. took Huginn's states at successive passes and checked where the intermediate and final answers ranked among possible output tokens {% cite "lu2025depthrecurrent" %}. The ranks varied with the layer they inspected and with whether they applied the model's final layers before reading out the tokens. They found little evidence of intermediate results appearing in the order of a written calculation. To test whether one pass supplied a quantity that the next pass used, we would want an intervention like the timetable swap.

## Looking Ahead

Two models could both reach Elm after two passes and respond differently to the timetable swap. Identifying what the second pass reads lets us predict which answer a change inside the model should produce. The next article asks [what makes an explanation mechanistic](/topics/what-is-mech-interp/) and how we can test one.
