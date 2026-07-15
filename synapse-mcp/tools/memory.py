import os
import json
import urllib.request
import urllib.error
from typing import List

# Retrieve host from environment, defaulting to http://localhost:3100
PORTAL_HOST = os.getenv("SYNAPSE_PORTAL_HOST", "http://localhost:3100")
BASE_URL = f"{PORTAL_HOST}/api"


def query_memory(tags: List[str]) -> str:
    """
    Query knowledge nodes from the Synapse Knowledge Portal by tags.

    Args:
        tags: A list of tags to filter by (e.g. ["project:synapse-portal", "technology:nextjs"]).

    Returns:
        A markdown string containing the matching knowledge nodes.
    """
    if not tags:
        return "❌ Error: At least one tag must be provided."

    url = f"{BASE_URL}/context/export"
    payload = {"tags": tags, "format": "md"}
    data = json.dumps(payload).encode("utf-8")

    try:
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Content-Type", "application/json")

        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                markdown_text = resp.read().decode("utf-8")
                if not markdown_text.strip():
                    return f"ℹ️ No matching knowledge nodes found for tags: {', '.join(tags)}"
                return markdown_text
            else:
                return f"❌ Failed: Server returned status {resp.status}"
    except urllib.error.HTTPError as e:
        if e.code == 400:
            return f"ℹ️ No matching knowledge nodes found for tags: {', '.join(tags)}"
        elif e.code == 500:
            return "❌ Server Error (500): The Portal backend encountered an issue. Please ensure the tags exist and the backend is healthy."
        else:
            return f"❌ HTTP Error: {e.code}"
    except Exception as e:
        return f"❌ Error connecting to Portal on host {PORTAL_HOST}: {e}"


def propose_memory(label: str, content: str, type: str, tags: List[str]) -> str:
    """
    Propose a new knowledge node to the Synapse Knowledge Portal.

    Args:
        label: Short descriptive title of the node.
        content: The full markdown/text content of the node.
        type: One of 'LESSON', 'CONTEXT', or 'FEATURE'.
        tags: List of tags. If type is 'LESSON', at least one 'section:' tag is required.

    Returns:
        A confirmation message with the recorded node details.
    """
    if type not in ["LESSON", "CONTEXT", "FEATURE"]:
        return "❌ Error: type must be 'LESSON', 'CONTEXT', or 'FEATURE'."

    if type == "LESSON":
        if not any(t.startswith("section:") for t in tags):
            return "❌ Error: LESSON type requires a 'section:<name>' tag (e.g. 'section:mistakes-to-avoid')."

    url = f"{BASE_URL}/propose"
    payload = {"label": label, "type": type, "content": content, "tags": tags}

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                result = json.loads(resp.read().decode())
                return f"✅ Success: Recorded {type} '{label}' (ID: {result.get('id')})"
            else:
                return f"❌ Failed: Server returned status {resp.status}"
    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode())
            return f"❌ Error proposing node: {err_data.get('error', e.reason)}"
        except Exception:
            return f"❌ HTTP Error: {e.code} ({e.reason})"
    except Exception as e:
        return f"❌ Error connecting to Portal on host {PORTAL_HOST}: {e}"


def approve_proposal(node_id: str) -> str:
    """
    Approve a pending knowledge proposal in the Synapse Knowledge Portal.

    Args:
        node_id: The UUID of the pending node proposal to approve.

    Returns:
        A success or failure message.
    """
    url = f"{BASE_URL}/gate"
    payload = {"id": node_id, "action": "APPROVE"}

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                return f"✅ Success: Proposal {node_id} approved."
            else:
                return f"❌ Failed: Server returned status {resp.status}"
    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode())
            return f"❌ Error: {err_data.get('message', e.reason)}"
        except Exception:
            return f"❌ HTTP Error: {e.code} ({e.reason})"
    except Exception as e:
        return f"❌ Error connecting to Portal on host {PORTAL_HOST}: {e}"


def reject_proposal(node_id: str) -> str:
    """
    Reject a pending knowledge proposal in the Synapse Knowledge Portal.

    Args:
        node_id: The UUID of the pending node proposal to reject.

    Returns:
        A success or failure message.
    """
    url = f"{BASE_URL}/gate"
    payload = {"id": node_id, "action": "REJECT"}

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                return f"✅ Success: Proposal {node_id} rejected."
            else:
                return f"❌ Failed: Server returned status {resp.status}"
    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode())
            return f"❌ Error: {err_data.get('message', e.reason)}"
        except Exception:
            return f"❌ HTTP Error: {e.code} ({e.reason})"
    except Exception as e:
        return f"❌ Error connecting to Portal on host {PORTAL_HOST}: {e}"


def increment_efficacy(node_id: str) -> str:
    """
    Increment the success count (efficacy tracking) of a knowledge node.

    Args:
        node_id: The UUID of the node to increment.

    Returns:
        Success or failure message.
    """
    url = f"{BASE_URL}/nodes/efficacy"
    payload = {"nodeId": node_id}

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                result = json.loads(resp.read().decode())
                return f"✅ Success: Efficacy count incremented. Current success count: {result.get('successCount')}"
            else:
                return f"❌ Failed: Server returned status {resp.status}"
    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode())
            return f"❌ Error: {err_data.get('error', e.reason)}"
        except Exception:
            return f"❌ HTTP Error: {e.code} ({e.reason})"
    except Exception as e:
        return f"❌ Error connecting to Portal on host {PORTAL_HOST}: {e}"


def list_nodes() -> str:
    """
    List all active/approved knowledge nodes currently present in the Synapse Knowledge Portal.

    Returns:
        A list of nodes with their ID, type, label, status, memory tier, and success count.
    """
    url = f"{BASE_URL}/nodes"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                nodes = json.loads(resp.read().decode())
                if not nodes:
                    return "ℹ️ No active/approved nodes found in the Portal."

                output = ["### Active/Approved Knowledge Nodes in Synapse Portal:"]
                for n in nodes:
                    tags_str = ", ".join(
                        [f"{t['scope']}:{t['name']}" for t in n.get("tags", [])]
                    )
                    output.append(
                        f"- **{n.get('label')}** ({n.get('type')})\n"
                        f"  - ID: `{n.get('id')}`\n"
                        f"  - Status: `{n.get('status')}` | Tier: `{n.get('memory_tier')}` | Efficacy: `{n.get('success_count')}`\n"
                        f"  - Tags: [{tags_str}]"
                    )
                return "\n".join(output)
            else:
                return f"❌ Failed: Server returned status {resp.status}"
    except Exception as e:
        return f"❌ Error connecting to Portal on host {PORTAL_HOST}: {e}"
