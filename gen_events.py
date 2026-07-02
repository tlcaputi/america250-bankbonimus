#!/usr/bin/env python3
"""Generate one Jekyll page per event in _events/ from _data/events.yml.

events.yml stays the single editable source of truth; run this after editing it
to (re)generate the per-event collection pages, then commit both.

    python3 gen_events.py
"""
import os
import sys
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "_data", "events.yml")
OUT = os.path.join(HERE, "_events")


# Force time-like strings (e.g. "07:00") to be single-quoted in the emitted
# front matter. PyYAML leaves a leading-zero time like 07:00 unquoted (it does
# not match PyYAML's sexagesimal-int pattern), but Ruby/Psych — the parser GH
# Pages uses — DOES read 07:00 as a base-60 number, so the layout's time filter
# then renders it as "12:00 AM". Quoting keeps it an unambiguous string.
class _Quoted(str):
    pass


def _quoted_representer(dumper, data):
    return dumper.represent_scalar("tag:yaml.org,2002:str", str(data), style="'")


yaml.SafeDumper.add_representer(_Quoted, _quoted_representer)

# front-matter keys (everything except the free-text description, which becomes the body).
# NOTE: we deliberately do NOT use a `date:` key — Jekyll auto-parses `date` on
# collection docs into a Time object, which breaks string `where:` matching.
# The event date lives in `eday` (a plain YYYY-MM-DD string).
FM_KEYS = ["id", "title", "region", "category", "eday", "start", "end", "all_day",
           "time_note", "venue", "address", "town", "lat", "lng", "cost",
           "ext_url", "source", "org", "featured"]


def main():
    with open(SRC) as f:
        events = yaml.safe_load(f)
    if not isinstance(events, list):
        sys.exit("events.yml did not parse to a list")

    os.makedirs(OUT, exist_ok=True)
    # clear stale generated pages
    for fn in os.listdir(OUT):
        if fn.endswith(".md"):
            os.remove(os.path.join(OUT, fn))

    seen = set()
    for e in events:
        eid = e.get("id")
        if not eid:
            sys.exit(f"event missing id: {e.get('title')!r}")
        if eid in seen:
            sys.exit(f"duplicate event id: {eid}")
        seen.add(eid)

        fm = {"layout": "event"}
        for k in FM_KEYS:
            if k == "ext_url":
                fm["ext_url"] = e.get("url", "")  # rename: collection pages own `url`
            elif k == "eday":
                fm["eday"] = e.get("date", "")    # rename: avoid Jekyll's reserved `date`
            elif k in e:
                fm[k] = e[k]
        # defaults
        fm.setdefault("all_day", False)
        fm.setdefault("featured", False)
        # keep time strings quoted so Ruby doesn't parse "07:00" as base-60
        for tk in ("start", "end"):
            if isinstance(fm.get(tk), str) and fm[tk]:
                fm[tk] = _Quoted(fm[tk])

        body = (e.get("description") or "").strip()
        front = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, default_flow_style=False)
        path = os.path.join(OUT, f"{eid}.md")
        with open(path, "w") as f:
            f.write("---\n")
            f.write(front)
            f.write("---\n")
            if body:
                f.write(body + "\n")

    print(f"generated {len(events)} event pages in _events/")


if __name__ == "__main__":
    main()
