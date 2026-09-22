# Elicitation kit (Sprint 1)

Course item 3 requires the elicitation techniques to be **applied**, with evidence. Lab 6 §5 currently says
"Next: validate". Everything here produces the evidence that replaces those lines before Sprint 2 planning.

| Technique | Target | Owner (suggested) | Due |
|---|---|---|---|
| Survey | 30+ responses | Jhanvi Barot | Wed 30 Sep |
| Shopper interviews | 3, about 20 min each | Om Pandya, Jenish Kavad, Rushiraj Navar | Thu 1 Oct |
| Observation | 1 real purchase, thinking aloud | Harshkumar Kodavala | Thu 1 Oct |
| Expert interview | 1 laptop or phone expert | Pal Jalodara | Thu 1 Oct |

Post every result in `#elicitation`, and save notes in `docs/elicitation/`.

**Consent:** tell every participant what the project is, that answers are used only for a course report,
and that names won't appear. For recordings, ask first; take notes instead if they say no.
Don't collect phone numbers or emails in the survey.

---

## 1. Survey (Google Form)

Title: **How do you research before you buy?** Intro: "A 3-minute survey for a university software project.
Anonymous. No personal details collected."

1. **How often do you research before buying electronics or other products?** *(multiple choice)*
   Always · Usually · Sometimes · Rarely
2. **Where do you look?** *(checkboxes)*
   Google search · Reddit · YouTube · Store reviews (Amazon, Flipkart) · Friends or family · Tech websites · Other
3. **What frustrates you most when researching?** *(checkboxes, pick up to 2)*
   Reviews disagree · Fake or paid reviews · Too many options · Outdated information · Jargon I don't understand · It takes too long
4. **How many questions would you answer before getting recommendations?** *(multiple choice)*
   0 to 3 · 4 to 6 · 7 to 10 · More than 10
5. **How important is it to see the source of each claim?** *(linear scale 1 to 5)* 1 = not at all, 5 = essential
6. **Should the app remember your preferences for next time?** *(multiple choice)*
   Yes · No · Only if I can see and delete them
7. **If two products are nearly tied, would you rather…** *(multiple choice)*
   The app picks one for me · See both and the one difference between them
8. **What would make you trust a recommendation?** *(short answer)*
9. **Tell us about the last product you researched: what it was, and how you decided.** *(paragraph)*

Questions 4 to 7 test specific design decisions (interview length, citations, memory, ties).
Report them as counts: "21 of 34 (62%) chose 4 to 6 questions".

---

## 2. Shopper interview script (about 20 minutes)

Warm-up
1. What's something you bought recently that you researched first?
2. Walk me through how you researched it, from the first search to buying.

Sources and trust
3. Which sources did you trust most, and why?
4. Did sources ever disagree? What did you do?
5. Have you ever felt a review was fake or paid? How could you tell?

The interview idea
6. If an app asked you questions before recommending, which would feel useful and which annoying?
7. What if you didn't understand a question, e.g. "Do you need ANC?" What would you want to happen?

Results
8. What would you want to see next to a recommendation to believe it?
9. If the app said "we couldn't verify this spec", would you trust it more or less?
10. Would you want it to remember your preferences next time? What would worry you?

Close: anything we didn't ask that matters to you when buying?

**Notes template**

```
Interview #: _   Date: _   Interviewer: _   Product discussed: _
Sources used (in order):
Trust signals mentioned:
Frustrations (quote them):
Reaction to the interview idea:
Reaction to "couldn't verify":
Memory: yes / no / conditional (why):
Most surprising thing:
Requirements this supports or changes (FR/NFR/DR IDs):
```

---

## 3. Observation template (real purchase, thinking aloud)

Ask the participant to research a product they actually plan to buy and say their thoughts aloud.
Don't help. Note the time at each step.

```
Participant: _   Product: _   Budget: _   Start time: _

Time | Action (site / search / click)    | What they said         | Why (your inference)
-----|-----------------------------------|------------------------|---------------------
     |                                   |                        |

Sources visited, in order:
Number of tabs open at peak:
Where they hesitated or gave up:
How they compared products (notes, tabs, memory):
Final decision and reason:
Total time:
Requirements this supports or changes:
```

---

## 4. Expert interview (laptop or phone)

1. When someone asks you for a laptop recommendation, what do you ask them first?
2. Here are our generated criteria for laptops (show `criteria.json` from `shared/contracts/examples/`).
   What's missing? What's wrong? What's too vague?
3. Which specs do manufacturers exaggerate most?
4. Which review sources do you trust, and for what?
5. What are the most common mistakes buyers make?
6. How do Indian and US versions of the same product differ?

Output: a corrected criteria list for the category, and a list of trusted sources per criterion.
These feed US-03 (criteria) and US-16 (source trust).

---

## 5. Turning results into the Lab 6 update

Rewrite each Lab 6 §5 finding in this form:

> **Finding:** Users want to see where claims come from.
> **Evidence:** 27 of 34 survey respondents (79%) rated source visibility 4 or 5 out of 5; 3 of 3 interviewees
> mentioned it unprompted.
> **Requirements:** FR-18, NFR-14.

If the evidence contradicts a requirement, say so and propose the change. That's elicitation working.
