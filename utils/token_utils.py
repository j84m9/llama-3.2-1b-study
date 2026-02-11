import os
from dotenv import load_dotenv
load_dotenv()


#tokenizer
from transformers import AutoTokenizer


# Live Display
class Tokenizer:
    def __init__(self, path_ = None):
        self.path=path_ or os.getenv("MODEL_PATH", "./Llama-3.2-1B")

    def instantiate(self):
        tokenizer = AutoTokenizer.from_pretrained(self.path)

        return tokenizer



def decoder(tokens: list[int], tokenizer: Tokenizer) -> list[tuple[str]]:
    """Decode tokens into list of tuples for html heelper."""

    subwords = []
    for token in tokens:
        subword = tokenizer.decode(token)
        subwords.append((subword,))

    return subwords


################################################################################################
# from annotated_text import annotated_text

# #define colors for text/token annotation
# colors = ["#b71c1c", "#2ecc71", "#ffc107", "#007bff"]

# #Decoder y
# def decoder(tokens: list[int]) -> annotated_text:
#     """Decode into annotated text."""

#     subwords = []
#     color_idx=0
#     for token in tokens:
#         subword = tokenizer.decode(token)
#         subwords.append((subword,"", colors[color_idx%len(colors)]))
#         color_idx+=1

#     return subwords