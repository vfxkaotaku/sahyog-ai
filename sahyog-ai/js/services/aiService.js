/**
 * aiService.js — SAHYOG AI
 * Demo AI Response Engine.
 *
 * Architecture:
 *   Chat UI → Chat Controller → AIService Interface → DemoAIService (current)
 *                                                   → RealAIService (future swap)
 *
 * To connect a real backend, replace DemoAIService.sendMessage()
 * with an HTTP/WebSocket call — the interface stays identical.
 */

var SAHYOG = window.SAHYOG = window.SAHYOG || {};

// ══════════════════════════════════════════════════════════════
//  RESPONSE DATABASE
//  Each category has: content (string), suggestions (string[])
//  in three languages: en | hi | mr
// ══════════════════════════════════════════════════════════════
SAHYOG._DemoResponses = {

  cropInsurance: {
    en: {
      content: "🌾 Pradhan Mantri Fasal Bima Yojana (PMFBY)\n\nPMFBY is India's flagship crop insurance scheme to protect farmers from crop losses.\n\n📌 Key Points:\n• Covers losses due to natural calamities, floods, droughts, pests & diseases\n• Kharif crop premium: 2% of Sum Insured\n• Rabi crop premium: 1.5% of Sum Insured\n• Commercial/Horticulture crops: 5%\n• Government pays the remaining premium on your behalf\n\n📋 Eligibility:\nAll farmers (loanee & non-loanee) growing notified crops in notified areas\n\n⚠️ Demo Note: This is illustrative information. Please verify current details at your nearest agriculture office, bank, or at pmfby.gov.in",
      suggestions: ["What documents are required for PMFBY?", "How do I claim crop insurance?", "What crops are covered under PMFBY?", "Explain this in Hindi"]
    },
    hi: {
      content: "🌾 प्रधानमंत्री फसल बीमा योजना (PMFBY)\n\nPMFBY किसानों को फसल नुकसान से बचाने के लिए भारत की प्रमुख फसल बीमा योजना है।\n\n📌 मुख्य बिंदु:\n• प्राकृतिक आपदाओं, बाढ़, सूखा, कीट और रोगों से होने वाले नुकसान को कवर करती है\n• खरीफ फसल प्रीमियम: बीमित राशि का 2%\n• रबी फसल प्रीमियम: 1.5%\n• व्यावसायिक/बागवानी फसलें: 5%\n• शेष प्रीमियम सरकार आपकी ओर से भरती है\n\n📋 पात्रता:\nसभी किसान (ऋणी और गैर-ऋणी) जो अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाते हैं\n\n⚠️ डेमो नोट: यह जानकारी प्रदर्शनात्मक है। कृपया अपने नजदीकी कृषि कार्यालय या बैंक से वर्तमान जानकारी सत्यापित करें।",
      suggestions: ["PMFBY के लिए क्या दस्तावेज चाहिए?", "फसल बीमा का दावा कैसे करें?", "कौन सी फसलें PMFBY में शामिल हैं?", "KCC क्या है?"]
    },
    mr: {
      content: "🌾 प्रधानमंत्री पिक विमा योजना (PMFBY)\n\nPMFBY ही शेतकऱ्यांना पिक नुकसानापासून संरक्षण देण्यासाठी भारताची प्रमुख पिक विमा योजना आहे.\n\n📌 मुख्य मुद्दे:\n• नैसर्गिक आपत्ती, पूर, दुष्काळ, कीड आणि रोगांमुळे होणाऱ्या नुकसानास संरक्षण\n• खरीप पीक हप्ता: विम्याच्या रकमेच्या 2%\n• रब्बी पीक हप्ता: 1.5%\n• व्यावसायिक/फळबाग पिके: 5%\n• उर्वरित हप्ता सरकार तुमच्यावतीने भरते\n\n📋 पात्रता:\nसर्व शेतकरी (कर्जदार व बिगर-कर्जदार) जे अधिसूचित क्षेत्रात अधिसूचित पिके घेतात\n\n⚠️ डेमो नोंद: ही माहिती प्रात्यक्षिक आहे. कृपया जवळच्या कृषी कार्यालयात किंवा बँकेत सध्याची माहिती तपासा.",
      suggestions: ["PMFBY साठी कोणती कागदपत्रे लागतात?", "पिक विम्याचा दावा कसा करावा?", "KCC म्हणजे काय?", "सहकारी संस्था म्हणजे काय?"]
    }
  },

  pmKisan: {
    en: {
      content: "🧑‍🌾 PM Kisan Samman Nidhi Yojana\n\nPM-KISAN provides income support directly to small and marginal farmers.\n\n📌 Key Points:\n• ₹6,000 per year paid in 3 equal installments of ₹2,000 each\n• Amount transferred directly to bank account (DBT)\n• Covers all landholding farmer families (subject to exclusion criteria)\n\n📋 Who is excluded:\n• Farmers with income tax obligations\n• Retired government employees\n• Professionals (doctors, engineers, lawyers, etc.)\n\n⚠️ Demo Note: This is illustrative information. Check pmkisan.gov.in for current status, installments, and registration.",
      suggestions: ["How to register for PM Kisan?", "How to check PM Kisan installment status?", "What is PMFBY crop insurance?", "Tell me about KCC"]
    },
    hi: {
      content: "🧑‍🌾 पीएम किसान सम्मान निधि योजना\n\nPM-KISAN छोटे और सीमांत किसानों को सीधे आय सहायता प्रदान करती है।\n\n📌 मुख्य बिंदु:\n• ₹6,000 प्रति वर्ष, 3 किश्तों में ₹2,000 प्रत्येक\n• राशि सीधे बैंक खाते में DBT के माध्यम से\n• सभी भूमिधारक किसान परिवार पात्र (कुछ अपवाद सहित)\n\n📋 कौन पात्र नहीं:\n• आयकरदाता किसान\n• सेवानिवृत्त सरकारी कर्मचारी\n• पेशेवर (डॉक्टर, इंजीनियर, वकील आदि)\n\n⚠️ डेमो नोट: यह जानकारी प्रदर्शनात्मक है। वर्तमान स्थिति के लिए pmkisan.gov.in देखें।",
      suggestions: ["PM किसान में पंजीकरण कैसे करें?", "PM किसान की किश्त कैसे चेक करें?", "PMFBY फसल बीमा क्या है?", "KCC के बारे में बताएं"]
    },
    mr: {
      content: "🧑‍🌾 पीएम किसान सन्मान निधी योजना\n\nPM-KISAN लहान व अल्पभूधारक शेतकऱ्यांना थेट उत्पन्न सहाय्य प्रदान करते.\n\n📌 मुख्य मुद्दे:\n• दरवर्षी ₹6,000, ₹2,000 च्या 3 हप्त्यांमध्ये\n• रक्कम थेट बँक खात्यात DBT द्वारे\n• सर्व जमीनधारक शेतकरी कुटुंबे पात्र (काही अपवाद वगळता)\n\n📋 कोण पात्र नाही:\n• आयकरदाते शेतकरी\n• निवृत्त सरकारी कर्मचारी\n• व्यावसायिक (डॉक्टर, इंजिनियर, वकील इ.)\n\n⚠️ डेमो नोंद: ही माहिती प्रात्यक्षिक आहे. सद्य स्थितीसाठी pmkisan.gov.in तपासा.",
      suggestions: ["PM किसानसाठी नोंदणी कशी करावी?", "PM किसान हप्ता कसा तपासावा?", "PMFBY पिक विमा म्हणजे काय?", "KCC बद्दल सांगा"]
    }
  },

  cooperative: {
    en: {
      content: "🤝 Cooperative Societies\n\nA cooperative society is a voluntary association of people who come together for mutual economic benefit.\n\n📌 Key Features:\n• Democratic control — one member, one vote\n• Open membership — anyone can join\n• Profits distributed as dividends to members\n• Governed by the respective State Cooperative Societies Act\n• Registered with the Registrar of Cooperative Societies\n\n🏦 Types include:\n• Agricultural Credit Cooperatives (PACS)\n• Dairy Cooperatives (e.g., Amul model)\n• Housing Cooperatives\n• Consumer Cooperatives\n\n⚠️ Demo Note: Specific rules vary by state. Contact your district Cooperative Department for local regulations.",
      suggestions: ["How to register a cooperative society?", "What are PACS?", "What is the difference between cooperative and company?", "How to file a grievance?"]
    },
    hi: {
      content: "🤝 सहकारी समितियां\n\nसहकारी समिति उन लोगों का स्वैच्छिक संगठन है जो परस्पर आर्थिक लाभ के लिए एकजुट होते हैं।\n\n📌 मुख्य विशेषताएं:\n• लोकतांत्रिक नियंत्रण — एक सदस्य, एक वोट\n• खुली सदस्यता — कोई भी शामिल हो सकता है\n• लाभ सदस्यों को लाभांश के रूप में वितरित\n• संबंधित राज्य सहकारी समिति अधिनियम द्वारा शासित\n• सहकारी समितियों के रजिस्ट्रार के पास पंजीकृत\n\n🏦 प्रकार:\n• कृषि ऋण सहकारी (PACS)\n• डेयरी सहकारी (जैसे अमूल मॉडल)\n• आवास सहकारी\n• उपभोक्ता सहकारी\n\n⚠️ डेमो नोट: नियम राज्य के अनुसार भिन्न होते हैं। स्थानीय नियमों के लिए अपने जिला सहकारी विभाग से संपर्क करें।",
      suggestions: ["सहकारी समिति का पंजीकरण कैसे करें?", "PACS क्या हैं?", "शिकायत कैसे दर्ज करें?", "KCC क्या है?"]
    },
    mr: {
      content: "🤝 सहकारी संस्था\n\nसहकारी संस्था म्हणजे परस्पर आर्थिक फायद्यासाठी एकत्र आलेल्या लोकांची स्वयंसेवी संघटना.\n\n📌 मुख्य वैशिष्ट्ये:\n• लोकशाही नियंत्रण — एक सदस्य, एक मत\n• खुले सदस्यत्व — कोणीही सहभागी होऊ शकते\n• नफा सदस्यांना लाभांश म्हणून वितरित\n• संबंधित राज्य सहकारी संस्था कायद्याद्वारे नियंत्रित\n• सहकारी संस्थांच्या निबंधकाकडे नोंदणीकृत\n\n🏦 प्रकार:\n• कृषी पतसंस्था (PACS)\n• दुग्ध सहकारी (उदा. अमूल मॉडेल)\n• गृहनिर्माण सहकारी\n• ग्राहक सहकारी\n\n⚠️ डेमो नोंद: नियम राज्यानुसार वेगळे असतात. स्थानिक नियमांसाठी जिल्हा सहकार विभागाशी संपर्क करा.",
      suggestions: ["सहकारी संस्थेची नोंदणी कशी करावी?", "PACS म्हणजे काय?", "तक्रार कशी दाखल करावी?", "पिक विमा म्हणजे काय?"]
    }
  },

  kcc: {
    en: {
      content: "💳 Kisan Credit Card (KCC)\n\nKCC is a credit facility for farmers to meet their agricultural and allied needs.\n\n📌 Key Features:\n• Short-term credit for crop cultivation\n• Interest rate typically 7% p.a. (may vary)\n• Prompt repayment incentive: additional interest subvention\n• Covers post-harvest expenses, farm maintenance, and allied activities\n• No collateral required up to ₹1.6 lakh (subject to bank policy)\n\n📋 How to apply:\nVisit your nearest bank branch (nationalized bank, cooperative bank, or RRB) with:\n• Land ownership documents\n• Identity proof\n• Passport-size photographs\n\n⚠️ Demo Note: This is illustrative information. Rates, limits, and eligibility vary by bank and government policy.",
      suggestions: ["What documents are needed for KCC?", "What is the interest rate on KCC?", "Tell me about PM Kisan", "What is PMFBY?"]
    },
    hi: {
      content: "💳 किसान क्रेडिट कार्ड (KCC)\n\nKCC किसानों की कृषि और संबंधित जरूरतों को पूरा करने के लिए एक ऋण सुविधा है।\n\n📌 मुख्य विशेषताएं:\n• फसल उत्पादन के लिए अल्पकालिक ऋण\n• ब्याज दर आमतौर पर 7% प्रति वर्ष (भिन्न हो सकती है)\n• समय पर भुगतान पर अतिरिक्त ब्याज सहायता\n• फसल के बाद के खर्च और खेत रखरखाव भी शामिल\n• ₹1.6 लाख तक कोई संपार्श्विक नहीं (बैंक नीति के अनुसार)\n\n📋 कैसे आवेदन करें:\nनजदीकी बैंक शाखा जाएं (राष्ट्रीयकृत बैंक, सहकारी बैंक, या RRB) के साथ:\n• भूमि स्वामित्व दस्तावेज\n• पहचान प्रमाण\n• पासपोर्ट साइज फोटो\n\n⚠️ डेमो नोट: यह जानकारी प्रदर्शनात्मक है। दरें और पात्रता बैंक नीति के अनुसार भिन्न होती हैं।",
      suggestions: ["KCC के लिए क्या दस्तावेज चाहिए?", "KCC पर ब्याज दर क्या है?", "PM किसान के बारे में बताएं", "PMFBY क्या है?"]
    },
    mr: {
      content: "💳 किसान क्रेडिट कार्ड (KCC)\n\nKCC ही शेतकऱ्यांच्या कृषी व संलग्न गरजा भागवण्यासाठी पतसुविधा आहे.\n\n📌 मुख्य वैशिष्ट्ये:\n• पीक उत्पादनासाठी अल्पकालीन कर्ज\n• व्याज दर साधारणपणे 7% प्रतिवर्ष (बदलू शकते)\n• वेळेत परतफेडीवर अतिरिक्त व्याज सवलत\n• काढणीनंतरचा खर्च आणि शेत देखभाल समाविष्ट\n• ₹1.6 लाखापर्यंत तारण नाही (बँक धोरणानुसार)\n\n📋 अर्ज कसा करावा:\nजवळच्या बँक शाखेत जा (राष्ट्रीयकृत बँक, सहकारी बँक किंवा RRB) सोबत:\n• जमिनीची कागदपत्रे\n• ओळखपत्र\n• पासपोर्ट आकाराचे फोटो\n\n⚠️ डेमो नोंद: ही माहिती प्रात्यक्षिक आहे. दर व पात्रता बँक धोरणानुसार बदलतात.",
      suggestions: ["KCC साठी कोणती कागदपत्रे लागतात?", "KCC वर व्याज दर किती?", "PM किसान बद्दल सांगा", "PMFBY म्हणजे काय?"]
    }
  },

  financial: {
    en: {
      content: "💰 Financial Literacy for Farmers\n\nFinancial literacy means understanding how money works — earning, saving, borrowing, and investing wisely.\n\n📌 Key Concepts:\n\n🏦 Savings: Keep money in a bank for safety and earn interest. SB accounts earn 3–4% p.a.\n\n📈 Interest: The cost of borrowing money. Lower interest = cheaper loan.\n\n📋 Types of bank accounts:\n• Savings Account — for daily use\n• Current Account — for business\n• Fixed Deposit (FD) — higher interest, money locked for a term\n• Recurring Deposit (RD) — save fixed amount monthly\n\n💡 Tip: Always compare interest rates before taking any loan.\n\n⚠️ Demo Note: This is illustrative. Consult a bank officer for personalized financial guidance.",
      suggestions: ["What is KCC?", "How to open a bank account?", "What is interest rate?", "Explain crop insurance"]
    },
    hi: {
      content: "💰 किसानों के लिए वित्तीय साक्षरता\n\nवित्तीय साक्षरता का अर्थ है यह समझना कि पैसा कैसे काम करता है — कमाई, बचत, उधार और समझदारी से निवेश।\n\n📌 मुख्य अवधारणाएं:\n\n🏦 बचत: सुरक्षा के लिए बैंक में पैसा रखें और ब्याज अर्जित करें। SB खाते 3-4% प्रति वर्ष ब्याज देते हैं।\n\n📈 ब्याज: पैसा उधार लेने की लागत। कम ब्याज = सस्ता ऋण।\n\n📋 बैंक खातों के प्रकार:\n• बचत खाता — दैनिक उपयोग के लिए\n• चालू खाता — व्यवसाय के लिए\n• सावधि जमा (FD) — अधिक ब्याज, निर्धारित अवधि\n• आवर्ती जमा (RD) — मासिक निश्चित राशि बचाएं\n\n💡 सुझाव: कोई भी ऋण लेने से पहले हमेशा ब्याज दरों की तुलना करें।\n\n⚠️ डेमो नोट: यह जानकारी प्रदर्शनात्मक है। व्यक्तिगत मार्गदर्शन के लिए बैंक अधिकारी से मिलें।",
      suggestions: ["KCC क्या है?", "बैंक खाता कैसे खोलें?", "ब्याज दर क्या होती है?", "फसल बीमा समझाएं"]
    },
    mr: {
      content: "💰 शेतकऱ्यांसाठी आर्थिक साक्षरता\n\nआर्थिक साक्षरता म्हणजे पैसा कसा काम करतो हे समजणे — कमाई, बचत, कर्ज आणि हुशारीने गुंतवणूक.\n\n📌 मुख्य संकल्पना:\n\n🏦 बचत: सुरक्षिततेसाठी बँकेत पैसे ठेवा आणि व्याज मिळवा. SB खाते 3-4% प्रतिवर्ष व्याज देते.\n\n📈 व्याज: पैसे कर्जाऊ घेण्याची किंमत. कमी व्याज = स्वस्त कर्ज.\n\n📋 बँक खात्यांचे प्रकार:\n• बचत खाते — दैनंदिन वापरासाठी\n• चालू खाते — व्यवसायासाठी\n• मुदत ठेव (FD) — जास्त व्याज, ठराविक मुदतीसाठी\n• आवर्ती ठेव (RD) — दरमहा ठराविक रक्कम बचत\n\n💡 सूचना: कोणतेही कर्ज घेण्यापूर्वी नेहमी व्याज दर तुलना करा.\n\n⚠️ डेमो नोंद: ही माहिती प्रात्यक्षिक आहे. वैयक्तिक मार्गदर्शनासाठी बँक अधिकाऱ्यांना भेटा.",
      suggestions: ["KCC म्हणजे काय?", "बँक खाते कसे उघडावे?", "व्याज दर म्हणजे काय?", "पिक विमा समजावून सांगा"]
    }
  },

  grievance: {
    en: {
      content: "📢 Filing a Grievance\n\nIf you have a complaint related to government schemes, agriculture, or cooperative services, here is how you can get help:\n\n📌 Available Channels:\n\n1️⃣ PM-KISAN Helpline: 155261 / 011-24300606\n2️⃣ National Farmers Helpline: 1800-180-1551 (toll-free)\n3️⃣ CPGRAMS Portal: pgportal.gov.in — for central government grievances\n4️⃣ State Agriculture Department: Contact your district office\n5️⃣ Cooperative Society: Contact the Registrar of Cooperative Societies\n\n📋 What to keep ready:\n• Your name, address, mobile number\n• Aadhaar / account number\n• Clear description of the problem\n• Any reference numbers or dates\n\n⚠️ Demo Note: This is illustrative information. Always use official portals and helplines for your actual grievance.",
      suggestions: ["What is CPGRAMS?", "How to track grievance status?", "Tell me about PM Kisan", "What documents do I need?"]
    },
    hi: {
      content: "📢 शिकायत दर्ज करना\n\nअगर आपको सरकारी योजनाओं, कृषि, या सहकारी सेवाओं से संबंधित शिकायत है, तो यहां जानें:\n\n📌 उपलब्ध चैनल:\n\n1️⃣ PM-KISAN हेल्पलाइन: 155261 / 011-24300606\n2️⃣ राष्ट्रीय किसान हेल्पलाइन: 1800-180-1551 (टोल-फ्री)\n3️⃣ CPGRAMS पोर्टल: pgportal.gov.in — केंद्र सरकार की शिकायतों के लिए\n4️⃣ राज्य कृषि विभाग: अपने जिला कार्यालय से संपर्क करें\n5️⃣ सहकारी समिति: सहकारी समितियों के रजिस्ट्रार से संपर्क करें\n\n📋 क्या तैयार रखें:\n• नाम, पता, मोबाइल नंबर\n• आधार / खाता संख्या\n• समस्या का स्पष्ट विवरण\n• कोई संदर्भ संख्या या तारीख\n\n⚠️ डेमो नोट: यह जानकारी प्रदर्शनात्मक है। वास्तविक शिकायत के लिए हमेशा आधिकारिक पोर्टल और हेल्पलाइन का उपयोग करें।",
      suggestions: ["CPGRAMS क्या है?", "शिकायत की स्थिति कैसे ट्रैक करें?", "PM किसान के बारे में जानें", "क्या दस्तावेज चाहिए?"]
    },
    mr: {
      content: "📢 तक्रार दाखल करणे\n\nसरकारी योजना, शेती किंवा सहकारी सेवांशी संबंधित तक्रार असल्यास, येथे जाणून घ्या:\n\n📌 उपलब्ध माध्यमे:\n\n1️⃣ PM-KISAN हेल्पलाईन: 155261 / 011-24300606\n2️⃣ राष्ट्रीय शेतकरी हेल्पलाईन: 1800-180-1551 (टोल-फ्री)\n3️⃣ CPGRAMS पोर्टल: pgportal.gov.in — केंद्र सरकारच्या तक्रारींसाठी\n4️⃣ राज्य कृषी विभाग: जिल्हा कार्यालयाशी संपर्क करा\n5️⃣ सहकारी संस्था: सहकारी संस्थांच्या निबंधकाशी संपर्क करा\n\n📋 काय तयार ठेवावे:\n• नाव, पत्ता, मोबाईल नंबर\n• आधार / खाते क्रमांक\n• समस्येचे स्पष्ट वर्णन\n• कोणतेही संदर्भ क्रमांक किंवा तारखा\n\n⚠️ डेमो नोंद: ही माहिती प्रात्यक्षिक आहे. प्रत्यक्ष तक्रारीसाठी अधिकृत पोर्टल व हेल्पलाईन वापरा.",
      suggestions: ["CPGRAMS म्हणजे काय?", "तक्रारीची स्थिती कशी तपासावी?", "PM किसान बद्दल जाणून घ्या", "कोणती कागदपत्रे लागतात?"]
    }
  },

  document: {
    en: {
      content: "📄 Understanding Government Documents\n\nGovernment documents can be complex, but SAHYOG AI can help explain them in simple language.\n\n📌 Common Documents You May Encounter:\n\n📋 Land Records:\n• 7/12 Extract (Satbara) — Land ownership & crop history\n• 8A Extract — Land tax record\n\n🪪 Identity & Eligibility:\n• Aadhaar Card — Universal identity\n• Ration Card — For BPL/APL benefits\n• Kisan Credit Card (KCC)\n\n🌾 Agricultural:\n• Crop Insurance Certificate (PMFBY)\n• Bank Passbook entries for DBT\n• PM-KISAN registration acknowledgment\n\n💡 Tip: If you receive a government letter you don't understand, you can describe it here and I'll explain it in simple language.\n\n⚠️ Demo Note: For legal interpretation of official documents, always consult an authorized official.",
      suggestions: ["What is a 7/12 extract?", "How to read land records?", "What is Aadhaar seeding?", "How to apply for ration card?"]
    },
    hi: {
      content: "📄 सरकारी दस्तावेज समझना\n\nसरकारी दस्तावेज जटिल हो सकते हैं, लेकिन SAHYOG AI उन्हें सरल भाषा में समझाने में मदद कर सकता है।\n\n📌 सामान्य दस्तावेज जो आप देख सकते हैं:\n\n📋 भूमि रिकॉर्ड:\n• 7/12 उतारा — भूमि स्वामित्व और फसल इतिहास\n• 8A उतारा — भूमि कर रिकॉर्ड\n\n🪪 पहचान और पात्रता:\n• आधार कार्ड — सार्वभौमिक पहचान\n• राशन कार्ड — BPL/APL लाभ के लिए\n• किसान क्रेडिट कार्ड (KCC)\n\n🌾 कृषि:\n• फसल बीमा प्रमाण पत्र (PMFBY)\n• DBT के लिए बैंक पासबुक एंट्री\n• PM-KISAN पंजीकरण पावती\n\n💡 सुझाव: अगर आपको कोई सरकारी पत्र समझ नहीं आता, तो यहां बताएं — मैं सरल भाषा में समझाऊंगा।\n\n⚠️ डेमो नोट: आधिकारिक दस्तावेजों की कानूनी व्याख्या के लिए अधिकृत अधिकारी से संपर्क करें।",
      suggestions: ["7/12 उतारा क्या है?", "भूमि रिकॉर्ड कैसे पढ़ें?", "आधार सीडिंग क्या है?", "राशन कार्ड के लिए आवेदन कैसे करें?"]
    },
    mr: {
      content: "📄 सरकारी कागदपत्रे समजून घेणे\n\nसरकारी कागदपत्रे गुंतागुंतीची असू शकतात, परंतु SAHYOG AI ती सोप्या भाषेत समजावून सांगण्यास मदत करू शकतो.\n\n📌 सामान्य कागदपत्रे:\n\n📋 जमिनीचे दस्तऐवज:\n• 7/12 उतारा — जमिनीचा मालकी हक्क व पीक नोंद\n• 8A उतारा — जमीन कर नोंद\n\n🪪 ओळख व पात्रता:\n• आधार कार्ड — सर्वसाधारण ओळखपत्र\n• शिधापत्रिका — BPL/APL लाभासाठी\n• किसान क्रेडिट कार्ड (KCC)\n\n🌾 शेती:\n• पिक विमा प्रमाणपत्र (PMFBY)\n• DBT साठी बँक पासबुक नोंद\n• PM-KISAN नोंदणी पावती\n\n💡 सूचना: एखादे सरकारी पत्र समजत नसल्यास, येथे वर्णन करा — मी सोप्या भाषेत समजावून सांगेन.\n\n⚠️ डेमो नोंद: अधिकृत कागदपत्रांच्या कायदेशीर अर्थासाठी नेहमी अधिकृत अधिकाऱ्यांशी संपर्क करा.",
      suggestions: ["7/12 उतारा म्हणजे काय?", "जमिनीचे दस्तऐवज कसे वाचावे?", "आधार सीडिंग म्हणजे काय?", "शिधापत्रिकेसाठी अर्ज कसा करावा?"]
    }
  },

  schemes: {
    en: {
      content: "📋 Important Government Schemes for Farmers\n\nHere are the major government schemes you should know about:\n\n🌾 1. PMFBY — Pradhan Mantri Fasal Bima Yojana\nCrop insurance for all farmers\n\n👨‍🌾 2. PM-KISAN — Pradhan Mantri Kisan Samman Nidhi\n₹6,000/year income support\n\n💳 3. KCC — Kisan Credit Card\nShort-term agricultural credit at low interest\n\n💧 4. PMKSY — Pradhan Mantri Krishi Sinchayee Yojana\nIrrigation & water conservation scheme\n\n🏘️ 5. PM Awas Yojana (Gramin)\nHousing scheme for rural families\n\n🥗 6. MGNREGA\nRural employment guarantee — 100 days/year\n\n⚠️ Demo Note: This is a summary of illustrative information. Always check official government portals for current eligibility and application procedures.",
      suggestions: ["Tell me about PMFBY", "What is PM Kisan?", "How to apply for KCC?", "What is cooperative society?"]
    },
    hi: {
      content: "📋 किसानों के लिए महत्वपूर्ण सरकारी योजनाएं\n\nये प्रमुख सरकारी योजनाएं हैं जो आपको जाननी चाहिए:\n\n🌾 1. PMFBY — प्रधानमंत्री फसल बीमा योजना\nसभी किसानों के लिए फसल बीमा\n\n👨‍🌾 2. PM-KISAN — प्रधानमंत्री किसान सम्मान निधि\n₹6,000/वर्ष आय सहायता\n\n💳 3. KCC — किसान क्रेडिट कार्ड\nकम ब्याज पर अल्पकालिक कृषि ऋण\n\n💧 4. PMKSY — प्रधानमंत्री कृषि सिंचाई योजना\nसिंचाई और जल संरक्षण\n\n🏘️ 5. PM आवास योजना (ग्रामीण)\nग्रामीण परिवारों के लिए आवास\n\n🥗 6. MGNREGA\nग्रामीण रोजगार गारंटी — 100 दिन/वर्ष\n\n⚠️ डेमो नोट: यह प्रदर्शनात्मक जानकारी है। वर्तमान पात्रता के लिए आधिकारिक सरकारी पोर्टल देखें।",
      suggestions: ["PMFBY के बारे में बताएं", "PM किसान क्या है?", "KCC के लिए आवेदन कैसे करें?", "सहकारी समिति क्या है?"]
    },
    mr: {
      content: "📋 शेतकऱ्यांसाठी महत्त्वाच्या सरकारी योजना\n\nया प्रमुख सरकारी योजना तुम्हाला माहीत असायला हव्यात:\n\n🌾 1. PMFBY — प्रधानमंत्री पिक विमा योजना\nसर्व शेतकऱ्यांसाठी पिक विमा\n\n👨‍🌾 2. PM-KISAN — प्रधानमंत्री किसान सन्मान निधी\n₹6,000/वर्ष उत्पन्न सहाय्य\n\n💳 3. KCC — किसान क्रेडिट कार्ड\nकमी व्याजावर अल्पकालीन कृषी कर्ज\n\n💧 4. PMKSY — प्रधानमंत्री कृषी सिंचन योजना\nसिंचन व जल संवर्धन\n\n🏘️ 5. PM आवास योजना (ग्रामीण)\nग्रामीण कुटुंबांसाठी घर\n\n🥗 6. MGNREGA\nग्रामीण रोजगार हमी — 100 दिवस/वर्ष\n\n⚠️ डेमो नोंद: ही प्रात्यक्षिक माहिती आहे. सद्य पात्रतेसाठी अधिकृत सरकारी पोर्टल तपासा.",
      suggestions: ["PMFBY बद्दल सांगा", "PM किसान म्हणजे काय?", "KCC साठी अर्ज कसा करावा?", "सहकारी संस्था म्हणजे काय?"]
    }
  },

  greeting: {
    en: {
      content: "👋 Hello! I'm SAHYOG AI, your agricultural and cooperative services assistant.\n\nI can help you with:\n\n🌾 Government agricultural schemes (PMFBY, PM-KISAN, KCC)\n🤝 Cooperative society information\n💰 Financial literacy for farmers\n📢 Grievance procedures\n📄 Understanding government documents\n\nHow can I help you today? You can also tap one of the quick action cards below to get started!",
      suggestions: ["Show government schemes", "Tell me about crop insurance", "What is KCC?", "How to file a grievance?"]
    },
    hi: {
      content: "👋 नमस्ते! मैं SAHYOG AI हूँ, आपका कृषि और सहकारी सेवाओं का सहायक।\n\nमैं आपकी इन विषयों में मदद कर सकता हूँ:\n\n🌾 सरकारी कृषि योजनाएं (PMFBY, PM-KISAN, KCC)\n🤝 सहकारी समिति की जानकारी\n💰 किसानों के लिए वित्तीय साक्षरता\n📢 शिकायत प्रक्रियाएं\n📄 सरकारी दस्तावेज समझना\n\nआज मैं आपकी कैसे मदद कर सकता हूँ? नीचे दिए गए क्विक एक्शन कार्ड का उपयोग करें!",
      suggestions: ["सरकारी योजनाएं दिखाएं", "फसल बीमा के बारे में बताएं", "KCC क्या है?", "शिकायत कैसे दर्ज करें?"]
    },
    mr: {
      content: "👋 नमस्कार! मी SAHYOG AI आहे, तुमचा कृषी आणि सहकारी सेवा सहाय्यक.\n\nमी तुम्हाला यामध्ये मदत करू शकतो:\n\n🌾 सरकारी कृषी योजना (PMFBY, PM-KISAN, KCC)\n🤝 सहकारी संस्थेची माहिती\n💰 शेतकऱ्यांसाठी आर्थिक साक्षरता\n📢 तक्रार प्रक्रिया\n📄 सरकारी कागदपत्रे समजून घेणे\n\nआज मी तुम्हाला कशी मदत करू? खाली दिलेल्या क्विक ॲक्शन कार्ड वापरा!",
      suggestions: ["सरकारी योजना दाखवा", "पिक विमा बद्दल सांगा", "KCC म्हणजे काय?", "तक्रार कशी दाखल करावी?"]
    }
  },

  general: {
    en: {
      content: "I'm SAHYOG AI, currently running in Demo Mode. 🟡\n\nI have demo knowledge about:\n• Government agricultural schemes (PMFBY, PM-KISAN, KCC)\n• Cooperative society information\n• Financial literacy for farmers\n• Grievance filing procedures\n• Government document explanation\n\nI didn't find a specific match for your question in my demo knowledge base. Could you rephrase your question, or choose from the quick actions below?\n\nFor real-time official information, please contact:\n• Kisan Helpline: 1800-180-1551 (Toll-Free)\n• PMFBY portal: pmfby.gov.in\n• PM-KISAN portal: pmkisan.gov.in",
      suggestions: ["Show government schemes", "Tell me about PMFBY", "What is a cooperative?", "How to file a grievance?"]
    },
    hi: {
      content: "मैं SAHYOG AI हूँ, वर्तमान में डेमो मोड में चल रहा हूँ। 🟡\n\nमेरे पास डेमो जानकारी है:\n• सरकारी कृषि योजनाएं (PMFBY, PM-KISAN, KCC)\n• सहकारी समिति की जानकारी\n• किसानों के लिए वित्तीय साक्षरता\n• शिकायत दर्ज करने की प्रक्रिया\n• सरकारी दस्तावेज स्पष्टीकरण\n\nआपके प्रश्न का मेरी डेमो नॉलेज बेस में कोई सटीक मिलान नहीं मिला। कृपया प्रश्न दोबारा पूछें, या नीचे दिए गए विकल्पों में से चुनें।\n\nवास्तविक जानकारी के लिए:\n• किसान हेल्पलाइन: 1800-180-1551 (टोल-फ्री)\n• PMFBY पोर्टल: pmfby.gov.in",
      suggestions: ["सरकारी योजनाएं दिखाएं", "PMFBY के बारे में बताएं", "सहकारी समिति क्या है?", "शिकायत कैसे दर्ज करें?"]
    },
    mr: {
      content: "मी SAHYOG AI आहे, सध्या डेमो मोडमध्ये चालत आहे. 🟡\n\nमाझ्याकडे डेमो माहिती आहे:\n• सरकारी कृषी योजना (PMFBY, PM-KISAN, KCC)\n• सहकारी संस्थेची माहिती\n• शेतकऱ्यांसाठी आर्थिक साक्षरता\n• तक्रार दाखल करण्याची प्रक्रिया\n• सरकारी कागदपत्रे स्पष्टीकरण\n\nतुमच्या प्रश्नाचे माझ्या डेमो ज्ञान बेसमध्ये अचूक मिळत नाही. कृपया प्रश्न पुन्हा विचारा किंवा खालील पर्यायांमधून निवडा.\n\nखऱ्या माहितीसाठी:\n• किसान हेल्पलाईन: 1800-180-1551 (टोल-फ्री)\n• PMFBY पोर्टल: pmfby.gov.in",
      suggestions: ["सरकारी योजना दाखवा", "PMFBY बद्दल सांगा", "सहकारी संस्था म्हणजे काय?", "तक्रार कशी दाखल करावी?"]
    }
  }
};


// ══════════════════════════════════════════════════════════════
//  KEYWORD MATCHER
// ══════════════════════════════════════════════════════════════
SAHYOG._matchCategory = function (text) {
  var t = text.toLowerCase();

  // Greeting
  if (/^(hi|hello|hey|namaste|नमस्ते|नमस्कार|हैलो|good morning|good evening)/.test(t) && t.length < 30) {
    return 'greeting';
  }
  // Crop Insurance
  if (t.includes('pmfby') || t.includes('fasal bima') || t.includes('crop insurance') ||
      t.includes('फसल बीमा') || t.includes('पिक विमा') || t.includes('fasal') ||
      t.includes('फसल') || t.includes('पीक विमा')) {
    return 'cropInsurance';
  }
  // PM Kisan
  if (t.includes('pm kisan') || t.includes('pm-kisan') || t.includes('kisan samman') ||
      t.includes('किसान सम्मान') || t.includes('किसान निधि') || t.includes('pmkisan') ||
      t.includes('6000') || t.includes('pm किसान') || t.includes('samman nidhi')) {
    return 'pmKisan';
  }
  // KCC
  if (t.includes('kcc') || t.includes('kisan credit') || t.includes('किसान क्रेडिट') ||
      t.includes('किसान कार्ड') || t.includes('kisan card') || t.includes('credit card for farmer')) {
    return 'kcc';
  }
  // Cooperative
  if (t.includes('cooperative') || t.includes('sahkari') || t.includes('सहकारी') ||
      t.includes('sahkarita') || t.includes('सहकारिता') || t.includes('pacs') ||
      t.includes('cooperative society') || t.includes('सहकार')) {
    return 'cooperative';
  }
  // Financial / Interest / Loan
  if (t.includes('financial') || t.includes('literacy') || t.includes('interest') ||
      t.includes('ब्याज') || t.includes('व्याज') || t.includes('loan') ||
      t.includes('ऋण') || t.includes('कर्ज') || t.includes('saving') ||
      t.includes('बचत') || t.includes('bank account') || t.includes('fd') ||
      t.includes('fixed deposit') || t.includes('वित्तीय') || t.includes('आर्थिक')) {
    return 'financial';
  }
  // Grievance
  if (t.includes('grievance') || t.includes('complaint') || t.includes('shikayat') ||
      t.includes('शिकायत') || t.includes('तक्रार') || t.includes('file a complaint') ||
      t.includes('cpgrams') || t.includes('helpline') || t.includes('हेल्पलाइन')) {
    return 'grievance';
  }
  // Document
  if (t.includes('document') || t.includes('दस्तावेज') || t.includes('कागदपत्र') ||
      t.includes('7/12') || t.includes('satbara') || t.includes('सातबारा') ||
      t.includes('land record') || t.includes('aadhaar') || t.includes('आधार') ||
      t.includes('ration card') || t.includes('राशन') || t.includes('papers')) {
    return 'document';
  }
  // Schemes (general)
  if (t.includes('scheme') || t.includes('yojana') || t.includes('योजना') ||
      t.includes('government scheme') || t.includes('सरकारी योजना') ||
      t.includes('schemes for farmer') || t.includes('list of scheme') ||
      t.includes('what scheme') || t.includes('important scheme') || t.includes('all scheme')) {
    return 'schemes';
  }

  return 'general';
};


// ══════════════════════════════════════════════════════════════
//  AI SERVICE INTERFACE
//  Replace this with a real backend call in future.
// ══════════════════════════════════════════════════════════════
SAHYOG.AIService = {
  /**
   * Send a message and receive a demo AI response.
   * @param {string} content - The user's message text.
   * @param {string} language - 'en' | 'hi' | 'mr'
   * @param {Array} history - Previous messages (for future contextual AI)
   * @returns {Promise<{content, suggestions, source}>}
   */
  sendMessage: function (content, language, history) {
    return new Promise(function (resolve, reject) {
      // Simulate network/processing delay
      var delay = 800 + Math.random() * 700;

      setTimeout(function () {
        try {
          var category = SAHYOG._matchCategory(content);
          var responses = SAHYOG._DemoResponses[category];
          var lang = (responses && responses[language]) ? language : 'en';
          var response = responses[lang];

          resolve({
            content: response.content,
            suggestions: response.suggestions || [],
            source: 'Demo Knowledge Base',
            category: category
          });
        } catch (e) {
          reject(new Error('Demo AI Service encountered an error. Please try again.'));
        }
      }, delay);
    });
  }
};
