#streamlit
import streamlit as st
from st_keyup import st_keyup
import streamlit_antd_components as sac


#Local CSS/HTML Helpers
from utils.load_css import local_css
from utils.html_utils import generate_annotated_html

local_css("./utils/style.css") #load our CSS style file

#tokenization
from utils.token_utils import Tokenizer, decoder

st.title("⚡Llama Tokenizer Visualization⚡")

# This updates every time a key is pressed
user_text = st_keyup("Type here to see live updates:", key="01")

# Segmented toggle between text and tokens
view_mode = sac.segmented(
    items=[sac.SegmentedItem(label='Text'), sac.SegmentedItem(label='Token IDs')],
    radius='lg', color='blue'
)


tokenizer = Tokenizer().instantiate()
tokens = tokenizer(user_text, return_tensors="pt")['input_ids'].flatten().tolist()[1:] #ignore the beginning of text token.

if user_text:
    if view_mode == 'Text':
        st.write("### Current Text:")
        decoded_text = decoder(tokens, tokenizer)
        st.markdown(generate_annotated_html(decoded_text), unsafe_allow_html=True)
    else:
        st.write("### Live Tokens:")
        st.code(tokens)