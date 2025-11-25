# Creating GitHub Milestones and Issues from `BACKLOG.md`

This script reads `BACKLOG.md` and creates GitHub milestones, epics, features, and user story issues using the GitHub REST API.

## Prerequisites

- Python 3.9+ installed
- `requests` library installed:

```pwsh
pip install requests
```

- A GitHub personal access token (classic or fine-grained) with `repo` permissions.

## Required environment variables

Set the following environment variables before running the script:

- `GITHUB_OWNER` – your GitHub username or organization (e.g., `aluczak`)
- `GITHUB_REPO` – repository name (e.g., `ml-recommender`)
- `GITHUB_TOKEN` – personal access token
- `BACKLOG_PATH` – optional, path to the backlog file (defaults to `BACKLOG.md` in repo root)

Example in PowerShell:

```pwsh
$env:GITHUB_OWNER = "aluczak"
$env:GITHUB_REPO = "ml-recommender"
$env:GITHUB_TOKEN = "<your_token_here>"
$env:BACKLOG_PATH = "BACKLOG.md"  # optional

python .\scripts\create_github_backlog.py
```

## What the script does

- Parses `BACKLOG.md` for:
  - `## Milestone ...` sections → GitHub milestones
  - `### Epic ...` sections under each milestone → GitHub issues labeled `epic`
  - `**Feature ...: ...**` sections under epics → GitHub issues labeled `feature`
  - `- **User Story ...:**` sections under features → GitHub issues labeled `user-story`
- Uses the milestone description text as the GitHub milestone description.
- Creates issues with proper hierarchy and cross-references:
  - Features reference their parent epic
  - User stories reference their parent feature and epic
- All items are associated with the appropriate milestone.

## Dry run mode

To preview what would be created without actually creating anything, set `DRY_RUN=true`:

```pwsh
$env:DRY_RUN = "true"
python .\scripts\create_github_backlog.py
```

## Running the script

Run it once after you are happy with `BACKLOG.md`. If you re-run it, you may end up with duplicate milestones/issues; the script does not currently perform any de-duplication.

## Adding issues to GitHub Projects

This script creates issues but does not automatically add them to a GitHub Project board. To add issues to a project:

1. Create a GitHub Project in your repository
2. After running this script, use GitHub's bulk selection to add issues:
   - Navigate to Issues tab
   - Filter by milestone (e.g., `milestone:"Milestone M1: Deployable Basic Web Application"`)
   - Select all issues
   - Use the "Projects" menu to add them to your project

Alternatively, you can use GitHub's automation rules to automatically add new issues with specific labels (epic, feature, user-story) to your project.
