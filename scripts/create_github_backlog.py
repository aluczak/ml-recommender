import os
import re
from typing import List, Dict, Any

import requests


def parse_backlog_md(path: str) -> Dict[str, Any]:
    """Parse BACKLOG.md into milestones, epics, features, and user stories.

    Expected structure:
    - "## Milestone ..." top-level
    - "### Epic ..." under each milestone
    - "**Feature ...:**" under epics (bold markdown)
    - "**User Story ...:**" under features (bold markdown)
    """

    milestones: List[Dict[str, Any]] = []
    current_milestone = None
    current_epic = None
    current_feature = None
    current_user_story = None

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
                current_feature = None
                current_user_story = None
                continue

            # Epic header
            if stripped.startswith("### Epic "):
                if not current_milestone:
                    raise ValueError("Epic defined before any milestone")
                current_epic = {
                    "title": stripped.replace("###", "").strip(),
                    "body_lines": [],
                    "features": [],
                }
                current_milestone["epics"].append(current_epic)
                current_feature = None
                current_user_story = None
                continue

            # Feature (bold markdown pattern: **Feature ...: ...**)
            feature_match = re.match(r'\*\*Feature ([^:]+): ([^*]+)\*\*$', stripped)
            if feature_match and current_epic:
                feature_id = feature_match.group(1).strip()
                feature_desc = feature_match.group(2).strip()
                current_feature = {
                    "id": feature_id,
                    "title": f"Feature {feature_id}",
                    "description": feature_desc,
                    "body_lines": [],
                    "user_stories": [],
                }
                current_epic["features"].append(current_feature)
                current_user_story = None
                continue

            # User Story (bold markdown pattern: - **User Story ...:**)
            story_match = re.match(r'^-\s+\*\*User Story ([^:]+):\*\*(.*)$', stripped)
            if story_match and current_feature:
                story_id = story_match.group(1).strip()
                story_desc = story_match.group(2).strip()
                current_user_story = {
                    "id": story_id,
                    "title": f"User Story {story_id}",
                    "description": story_desc,
                    "body_lines": [],
                }
                current_feature["user_stories"].append(current_user_story)
                continue

            # Plain text: collect as body lines
            if current_user_story is not None:
                # Inside a user story
                if stripped and not stripped.startswith("####"):
                    current_user_story["body_lines"].append(stripped)
            elif current_feature is not None:
                # Inside a feature but not in a user story
                if stripped and not stripped.startswith("####"):
                    current_feature["body_lines"].append(stripped)
            elif current_epic is not None:
                # Inside an epic but not in a feature
                if stripped and not stripped.startswith("####"):
                    current_epic["body_lines"].append(stripped)
            elif current_milestone and not current_epic:
                # Part of milestone description
                if stripped:
                    if current_milestone["description"]:
                        current_milestone["description"] += "\n" + stripped
                    else:
                        current_milestone["description"] = stripped

    if current_milestone:
        milestones.append(current_milestone)

    # Finalize bodies
    for m in milestones:
        for e in m["epics"]:
            e["body"] = "\n".join(e.get("body_lines", []))
            e.pop("body_lines", None)
            for f in e["features"]:
                f["body"] = f"{f['description']}\n\n" + "\n".join(f.get("body_lines", []))
                f.pop("body_lines", None)
                for s in f["user_stories"]:
                    s["body"] = f"{s['description']}\n\n" + "\n".join(s.get("body_lines", []))
                    s.pop("body_lines", None)

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
    dry_run = os.environ.get("DRY_RUN", "false").lower() in ("true", "1", "yes")

    if not dry_run and (not owner or not repo or not token):
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
    if dry_run:
        print("\n*** DRY RUN MODE - No issues will be created ***\n")

    for m in milestones:
        m_title = m["title"]
        print(f"\nMilestone: {m_title}")
        
        if not dry_run:
            m_number = create_milestone(session, owner, repo, m_title, m.get("description", ""))
            print(f"  -> Created milestone #{m_number}")
        else:
            print(f"  -> Would create milestone")

        for e in m["epics"]:
            e_title = e["title"]
            e_body = e.get("body", "")
            print(f"\n  Epic: {e_title}")
            
            if not dry_run:
                epic_issue_number = create_issue(
                    session,
                    owner,
                    repo,
                    title=e_title,
                    body=e_body,
                    milestone_number=m_number,
                    labels=["epic"],
                )
                print(f"    -> Created issue #{epic_issue_number}")
            else:
                print(f"    -> Would create epic issue")
                epic_issue_number = None

            # Create feature issues
            for f in e.get("features", []):
                f_title = f["title"]
                f_body = f.get("body", "")
                if epic_issue_number and not dry_run:
                    f_body += f"\n\nRelated to epic: #{epic_issue_number}"
                
                print(f"    Feature: {f_title}")
                
                if not dry_run:
                    feature_issue_number = create_issue(
                        session,
                        owner,
                        repo,
                        title=f_title,
                        body=f_body,
                        milestone_number=m_number,
                        labels=["feature"],
                    )
                    print(f"      -> Created issue #{feature_issue_number}")
                else:
                    print(f"      -> Would create feature issue")
                    feature_issue_number = None

                # Create user story issues
                for s in f.get("user_stories", []):
                    s_title = s["title"]
                    s_body = s.get("body", "")
                    if feature_issue_number and not dry_run:
                        s_body += f"\n\nRelated to feature: #{feature_issue_number}"
                    if epic_issue_number and not dry_run:
                        s_body += f"\nRelated to epic: #{epic_issue_number}"
                    
                    print(f"      User Story: {s_title}")
                    
                    if not dry_run:
                        story_issue_number = create_issue(
                            session,
                            owner,
                            repo,
                            title=s_title,
                            body=s_body,
                            milestone_number=m_number,
                            labels=["user-story"],
                        )
                        print(f"        -> Created issue #{story_issue_number}")
                    else:
                        print(f"        -> Would create user story issue")


if __name__ == "__main__":
    main()
