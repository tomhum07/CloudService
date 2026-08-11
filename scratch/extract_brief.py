import sys

def extract_brief(plan_path, task_num, out_path):
    with open(plan_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    brief_lines = []
    in_task = False
    next_task_heading = f"### Task {task_num + 1}:"
    current_task_heading = f"### Task {task_num}:"
    
    for line in lines:
        if line.startswith(current_task_heading):
            in_task = True
        elif line.startswith(next_task_heading):
            in_task = False
        
        if in_task:
            brief_lines.append(line)
            
    with open(out_path, "w", encoding="utf-8") as f:
        f.writelines(brief_lines)
    print(f"Extracted Task {task_num} to {out_path}")

if __name__ == "__main__":
    plan = sys.argv[1]
    num = int(sys.argv[2])
    out = sys.argv[3]
    extract_brief(plan, num, out)
