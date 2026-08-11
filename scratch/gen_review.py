import sys
import subprocess

def gen_review(plan_slug, base, head):
    out = f".superpowers/sdd/{plan_slug}/review-{base[:7]}..{head[:7]}.diff"
    
    # Run git commands
    commits = subprocess.check_output(f"git log --oneline {base}..{head}", shell=True).decode("utf-8")
    stat = subprocess.check_output(f"git diff --stat {base}..{head}", shell=True).decode("utf-8")
    diff = subprocess.check_output(f"git diff -U10 {base}..{head}", shell=True).decode("utf-8")
    
    content = f"# Review package: {base}..{head}\n\n## Commits\n{commits}\n## Files changed\n{stat}\n## Diff\n{diff}"
    
    with open(out, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Wrote review package to {out}")

if __name__ == "__main__":
    slug = sys.argv[1]
    base = sys.argv[2]
    head = sys.argv[3]
    gen_review(slug, base, head)
