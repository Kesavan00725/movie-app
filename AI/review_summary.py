from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage,SystemMessage,AIMessage
from dotenv import load_dotenv

movie = "Nun 2"
over_all_rating = "8.2"
review = '''
1. Absolutely loved the movie! The visuals were stunning, and the story kept me engaged from start to finish.
2. Great performances by the cast. The emotional scenes felt genuine and memorable.
3. The movie had an interesting concept, but the pacing felt a bit slow in the middle.
4. Amazing action sequences and excellent background music. Definitely worth watching on the big screen.
5. The storyline was predictable, but the characters were well-developed and enjoyable.
6. I enjoyed the humor and chemistry between the lead actors. It made the movie entertaining throughout.
7. The first half was fantastic, but the ending felt rushed and could have been better.
8. A visually beautiful film with strong performances. Some scenes were emotional and really impactful.
9. Not my favorite movie, but it had a few memorable moments and impressive cinematography.
10. An overall enjoyable experience with a good balance of action, drama, and suspense. I would recommend it to others.
'''

prompt = PromptTemplate.from_template('''
    User_Review:
    {review}
    
    Overall_rating:
    {overall_rating}
    
    Movie:
    {movie}
''')

load_dotenv()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=1.9,
    max_tokens=3000
)

content = prompt.invoke({"review": review, "overall_rating": over_all_rating, "movie": movie})
system = SystemMessage(
    content="""
You are a movie review summarizer.

Given the movie name, overall rating, and user reviews:
- Generate a concise summary in 3-5 sentences.
- Mention the overall audience sentiment.
- Highlight strengths and weaknesses.
- Do not repeat reviews verbatim.
- Return only the summary.
"""
)

human = HumanMessage(content=content.to_string())

response = llm.invoke([system]+[human])

print(response.content)

