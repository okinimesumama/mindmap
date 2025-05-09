import streamlit as st
import json
import re

# -------------------------
# 데이터 로드 및 전처리
# -------------------------
mental_disorders_path = '질병_증상_치료법_치료제.json'
medications_path = '치료제_부작용.json'
synonyms_path = 'final_synonym_dict.json'

with open(mental_disorders_path, 'r', encoding='utf-8') as f:
    mental_disorders = json.load(f)
with open(medications_path, 'r', encoding='utf-8') as f:
    medications = json.load(f)
with open(synonyms_path, 'r', encoding='utf-8') as f:
    synonyms = json.load(f)

def build_medication_synonym_map(medications):
    med_synonyms = {}
    for med in medications:
        med_field = med.get('약물 (일반명/상품명)', '')
        match = re.match(r'(.+?)\s*\((.+?)\)', med_field)
        if match:
            names = [match.group(1).strip(), match.group(2).strip()]
        else:
            names = [med_field]
        med_synonyms[names[0]] = names
    return med_synonyms

med_synonym_map = build_medication_synonym_map(medications)
for key, values in med_synonym_map.items():
    synonyms[key] = list(set(synonyms.get(key, []) + values))

def match_synonym(user_input, target_key):
    return any(re.search(rf'\b{re.escape(word)}\b', user_input) for word in synonyms.get(target_key, [target_key]))

# -------------------------
# 챗봇 로직
# -------------------------
sensitive_triggers = ['죽고 싶', '자살', '극단', '해치']
personality_triggers = ['충동', '대인관계', '분노', '불안정']
med_keywords = ['약', '약물', '치료', '복용', '추천', '먹는 약']

def format_symptoms(symptom_str):
    items = re.split(r'[·,;]', symptom_str)
    items = [item.strip() for item in items if item.strip()]
    return "<ul>" + "".join(f"<li>{item}</li>" for item in items) + "</ul>"

def chatbot(user_input):
    try:
        user_input_clean = re.sub(r'[^\w\s]', '', user_input.strip())

        if any(trigger in user_input_clean for trigger in sensitive_triggers):
            return "⚠️ 위험한 생각이 드신다면 가까운 사람이나 전문가에게 꼭 도움을 요청하세요. 💛 당신은 혼자가 아닙니다."

        if '부작용' in user_input_clean:
            for med in medications:
                med_field = med.get('약물 (일반명/상품명)', '')
                med_names = med_synonym_map.get(med_field.split()[0], [med_field])
                if any(med_name in user_input_clean for med_name in med_names):
                    return f"{med_field} 부작용:<br>- {med.get('부작용 상세', '부작용 정보 없음')}"
            return "앗, 해당 약물의 부작용 정보를 아직 찾지 못했어요."

        for disorder in mental_disorders:
            disorder_name = disorder.get('질병', '')
            if match_synonym(user_input_clean, disorder_name):
                treatments = disorder.get('치료제', '')
                symptoms = format_symptoms(disorder.get('증상', ''))
                if any(kw in user_input_clean for kw in med_keywords) and treatments:
                    return f"{disorder_name}에 사용되는 약물:<br>- {treatments}<br>📌 특징 증상:<br>{symptoms}"

        matched_diseases = []
        for disorder in mental_disorders:
            disorder_name = disorder.get('질병', '')
            raw_symptoms = disorder.get('증상', '')
            symptom_words = re.split(r'[·, ]', raw_symptoms)
            match_count = sum(1 for word in symptom_words if word and word in user_input_clean)
            if match_synonym(user_input_clean, disorder_name) or match_count >= 1:
                matched_diseases.append((disorder_name, raw_symptoms))

        trigger_count = sum(1 for trigger in personality_triggers if trigger in user_input_clean)
        if trigger_count >= 2:
            disorder = next((d for d in mental_disorders if d.get('질병') == '성격장애'), {})
            matched_diseases.append(('성격장애', disorder.get('증상', '증상 정보 없음')))

        if matched_diseases:
            response = "🔍 관련 질병 및 특징 :<br><br>"
            for name, raw_symptoms in matched_diseases[:3]:
                formatted = format_symptoms(raw_symptoms)
                response += f"<b>{name}</b>:<br>{formatted}<br>"
            response += "더 궁금한 게 있으면 편하게 물어봐 주세요 😊"
            return response

        for key, words in synonyms.items():
            if any(word in user_input_clean for word in words):
                disorder = next((d for d in mental_disorders if d.get('질병') == key), {})
                symptoms = format_symptoms(disorder.get('증상', '증상 정보 없음'))
                return f"{key} 관련된 감정이 느껴져요.<br>📌 특징:<br>{symptoms}더 궁금한 게 있으면 물어봐 주세요 😊"

        return "앗, 아직 해당 질문에 대한 답변을 준비하지 못했어요. 조금 더 구체적으로 말씀해 주세요 😊"

    except Exception as e:
        return f"앗, 오류가 발생했어요! 잠시 후 다시 시도해 주세요.<br>(오류 내용: {str(e)})"

# -------------------------
# Streamlit UI
# -------------------------
st.set_page_config(page_title="💬 마음 챗봇", page_icon="💬", layout="centered")

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

st.markdown("""
<style>
.user-message {
    background-color: #DCF8C6;
    padding: 10px;
    border-radius: 10px;
    margin: 5px;
    max-width: 70%;
    float: right;
    clear: both;
}
.bot-message {
    background-color: #E6E6FA;
    padding: 10px;
    border-radius: 10px;
    margin: 5px;
    max-width: 70%;
    float: left;
    clear: both;
}
button[kind="formSubmit"] {
    min-width: 90px;
    white-space: nowrap;
}
</style>
""", unsafe_allow_html=True)

st.title("💬 마음 챗봇")
st.markdown("""
안녕하세요! 저는 **마음 건강 챗봇**이에요.  
증상, 질병, 약물, 부작용 관련 질문을 자유롭게 해보세요.

⚠️ **주의 :** 이 챗봇은 참고용입니다.  
정확한 진단 및 치료는 반드시 의료진과 상담하세요!
""")

with st.form(key='chat_form', clear_on_submit=True):
    col1, col2 = st.columns([9, 2])  # col2 비율 확대
    with col1:
        user_input = st.text_input("궁금한 걸 입력해주세요 :", key="user_input", label_visibility="collapsed")
    with col2:
        submit_button = st.form_submit_button("🚀 보내기")

if submit_button and user_input:
    response = chatbot(user_input)
    response += "<br><br>⚠️ 참고 : 정확한 진단과 치료는 반드시 의료진에게 상담하세요."
    st.session_state.chat_history.append(("user", user_input))
    st.session_state.chat_history.append(("bot", response))

for sender, message in st.session_state.chat_history:
    css_class = "user-message" if sender == "user" else "bot-message"
    st.markdown(f"<div class='{css_class}'>{message}</div>", unsafe_allow_html=True)

st.markdown("---")
st.markdown("✅ 만든 사람: MINDMAP | 📌 마음건강 챗봇 | 🩺 의료상담은 전문가와 함께하세요")

# 경로 확인 후  
# cd C:\\Users\\jimin\\Downloads  
# streamlit run final_chatbot.py
