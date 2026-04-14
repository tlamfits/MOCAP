#!/usr/bin/env python3
"""Strip Cursor read_file-style line prefixes from stdin: '   123|content' -> 'content'."""
import re
import sys

pat = re.compile(r"^\s*\d+\|")


def main() -> None:
    for line in sys.stdin:
        sys.stdout.write(pat.sub("", line, count=1))


if __name__ == "__main__":
    main()
