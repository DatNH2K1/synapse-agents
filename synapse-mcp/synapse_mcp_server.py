from mcp.server.fastmcp import FastMCP
from tools.memory import (
    query_memory,
    propose_memory,
    approve_proposal,
    reject_proposal,
    increment_efficacy,
    list_nodes,
)
from tools.better_auth import init_better_auth
from tools.repo_indexer import index_repository, query_repository_index
from tools.docs_seeker import fetch_online_docs, analyze_llms_txt
from tools.context_analyzer import analyze_context_health, calculate_context_budget
from tools.copywriting import list_writing_styles, extract_writing_style
from tools.distillator import analyze_distillation_sources
from tools.design_system import generate_design_system_recommendation
from tools.ai_artist import generate_ai_art, search_ai_art_prompts

# Initialize FastMCP Server
mcp = FastMCP("SynapsePortal")

# Register imported tools
mcp.tool()(query_memory)
mcp.tool()(propose_memory)
mcp.tool()(approve_proposal)
mcp.tool()(reject_proposal)
mcp.tool()(increment_efficacy)
mcp.tool()(list_nodes)
mcp.tool()(init_better_auth)
mcp.tool()(index_repository)
mcp.tool()(query_repository_index)
mcp.tool()(fetch_online_docs)
mcp.tool()(analyze_llms_txt)
mcp.tool()(analyze_context_health)
mcp.tool()(calculate_context_budget)
mcp.tool()(list_writing_styles)
mcp.tool()(extract_writing_style)
mcp.tool()(analyze_distillation_sources)
mcp.tool()(generate_design_system_recommendation)
mcp.tool()(generate_ai_art)
mcp.tool()(search_ai_art_prompts)

if __name__ == "__main__":
    mcp.run()
