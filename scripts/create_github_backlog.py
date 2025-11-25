import os
import re
from typing import List, Dict, Any

import requests


def parse_backlog_md(path: str) -> Dict[str, Any]:
    """Parse BACKLOG.md into milestones and epics.

    Expected structure:
    - "## Milestone ..." top-level
    - "### Epic ..." under each milestone
    - Bullets under each epic become the epic body/description.
    """

    milestones: List[Dict[str, Any]] = []
    current_milestone = None
    current_epic = None

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()

            # Milestone header
            if stripped.startswith("## Milestone "):
                if current_milestone:
                    milestones.append(current_milestone)
                title = stripped.replace("##", "").strip()
                current_milestone = {
                    "title": title,
                    "description": "",
                    "epics": [],
                }
                current_epic = None
                continue

            # Epic header
            if stripped.startswith("### Epic "):
                if not current_milestone:
                    raise ValueError("Epic defined before any milestone")
                current_epic = {
                    "title": stripped.replace("###", "").strip(),
                    "body_lines": [],
                }
                current_milestone["epics"].append(current_epic)
                continue

            # Plain text: either milestone description (immediately after header)
            # or epic body (bullets / paragraphs under epic)
            if current_milestone and not current_epic:
                # part of milestone description
                if stripped:
                    if current_milestone["description"]:
                        current_milestone["description"] += "\n" + stripped
                    else:
                        current_milestone["description"] = stripped
            elif current_epic is not None:
                # Inside an epic
                if stripped:
                    current_epic["body_lines"].append(stripped)

    if current_milestone:
        milestones.append(current_milestone)

    # Finalize epic bodies
    for m in milestones:
        for e in m["epics"]:
            e["body"] = "\n".join(e.get("body_lines", []))
            e.pop("body_lines", None)

    return {"milestones": milestones}


def create_milestone(session: requests.Session, owner: str, repo: str, title: str, description: str) -> int:
    url = f"https://api.github.com/repos/{owner}/{repo}/milestones"
    payload = {
        "title": title,
        "description": description,
        "state": "open",
    }
    resp = session.post(url, json=payload)
    resp.raise_for_status()
    data = resp.json()
    return data["number"]


def create_issue(session: requests.Session, owner: str, repo: str, title: str, body: str, milestone_number: int, labels: List[str]) -> int:
    url = f"https://api.github.com/repos/{owner}/{repo}/issues"
    payload: Dict[str, Any] = {
        "title": title,
        "body": body,
        "milestone": milestone_number,
        "labels": labels,
    }
    resp = session.post(url, json=payload)
    resp.raise_for_status()
    data = resp.json()
    return data["number"]


def main() -> None:
    backlog_path = os.environ.get("BACKLOG_PATH", "BACKLOG.md")
    owner = os.environ.get("GITHUB_OWNER")
    repo = os.environ.get("GITHUB_REPO")
    token = os.environ.get("GITHUB_TOKEN")

    if not owner or not repo or not token:
        raise SystemExit("GITHUB_OWNER, GITHUB_REPO and GITHUB_TOKEN must be set in the environment")

    parsed = parse_backlog_md(backlog_path)
    milestones = parsed["milestones"]

    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    })

    print(f"Found {len(milestones)} milestones in {backlog_path}")

    for m in milestones:
        m_title = m["title"]
        print(f"Creating milestone: {m_title}")
        m_number = create_milestone(session, owner, repo, m_title, m.get("description", ""))
        print(f"  -> milestone number {m_number}")

        for e in m["epics"]:
            e_title = e["title"]
            e_body = e.get("body", "")
            print(f"  Creating epic issue: {e_title}")
            issue_number = create_issue(
                session,
                owner,
                repo,
                title=e_title,
                body=e_body,
                milestone_number=m_number,
                labels=["epic"],
            )
            print(f"    -> issue #{issue_number}")


if __name__ == "__main__":
    main()
