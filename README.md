# JTDX

My personal take on extending JSON Typedef.

# Reasoning

- Why do I need to extend JSON Typedef?
  > I'm working on a project, where users should be able to create forms from
  > JSON data. JSON Typedef is not expressive enough to fit the requirements.
- Why don't I choose JSON Schema based form builders that already exist, like
  [JSON Forms](https://jsonforms.io/)?
  > - There are so many versions of JSON Schema. It is just hard to tell which
  >   version those libraries are based on and what portion of features they
  >   support.
  > - I don't know how to implement features like lazy loading on top of those
  >   libraries.
  > - Writing separate UI schemas is just an overkill for my use case.
- Why do I prefer JSON Typedef over JSON Schema?
  > - Although JSON Typedef is not as expressive as JSON Schema, it is good
  >   enough for my use case.
  > - The expressiveness of JSON Schema (for example, those compound keywords)
  >   makes it complicated to build a JSON Schema-based form builder. It just
  >   doesn't worth my time.
- Why do I extend JSON Typedef instead of leveraging the `metadata` field it
  already provides?
  > Supporting features like lazy loading already breaks JSON Typedef. Enabling
  > these features by putting related stuff in the `metadata` field just makes
  > that less obvious. For other features, it is just for consistency.
