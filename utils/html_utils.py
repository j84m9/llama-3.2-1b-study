def generate_annotated_html(items):
    """
    Takes a list of items and returns an HTML string.
    Items can be:
      - A simple string: "Hello"
      - A tuple for highlights: ("text", "optional_bold_suffix")
    """
    colors = ["blue", "red", "green", "yellow"]
    color_idx = 0
    
    parts = []
    for item in items:
        if isinstance(item, str):
            parts.append(item)
        elif isinstance(item, tuple):
            text = item[0]
            bold_suffix = item[1] if len(item) > 1 else ""
            color = colors[color_idx % len(colors)]
            
            # Construct the span with optional nested bold span
            if bold_suffix:
                inner = f"{text} <span class='bold'>{bold_suffix}</span>"
            else:
                inner = text
                
            parts.append(f"<span class='highlight {color}'>{inner}</span>")
            color_idx += 1
            
    return f"<div>{''.join(parts)}</div>"