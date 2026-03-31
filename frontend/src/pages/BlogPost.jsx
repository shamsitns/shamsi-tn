import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaArrowRight } from 'react-icons/fa';

const BlogPost = () => {
    const { slug } = useParams();
    
    const posts = {
        'cout-energie-solaire-tunisie-2026': {
            title: 'تكلفة الطاقة الشمسية في تونس 2026',
            date: '31 مارس 2026',
            author: 'فريق Shamsi.tn',
            content: `
                <p>تتراوح تكلفة تركيب الطاقة الشمسية في تونس بين <strong>2000 و 3000 دينار لكل كيلوواط</strong> حسب جودة المعدات والشركة المنفذة.</p>
                
                <h2>عوامل تؤثر على التكلفة:</h2>
                <ul>
                    <li>قدرة النظام المطلوبة (kW)</li>
                    <li>نوع الألواح (مونوكريستالين / بولي كريستالين)</li>
                    <li>جودة العاكس (Inverter)</li>
                    <li>تكلفة التركيب والنقل</li>
                </ul>
                
                <h2>مثال على التكلفة:</h2>
                <ul>
                    <li><strong>نظام 3kW:</strong> 8,000 - 10,000 دينار</li>
                    <li><strong>نظام 5kW:</strong> 14,000 - 17,000 دينار</li>
                    <li><strong>نظام 10kW:</strong> 26,000 - 32,000 دينار</li>
                </ul>
                
                <p>يمكنك الحصول على <strong>دراسة مجانية</strong> لمنزلك من خلال <a href="/calculator">حاسبة الطاقة الشمسية</a>.</p>
            `
        },
        'choisir-entreprise-solaire-tunisie': {
            title: 'كيف تختار أفضل شركة لتركيب الطاقة الشمسية في تونس؟',
            date: '28 مارس 2026',
            author: 'فريق Shamsi.tn',
            content: `
                <p>اختيار الشركة المناسبة هو أهم خطوة لضمان جودة التركيب وكفاءة النظام. إليك 5 معايير حاسمة:</p>
                
                <h2>1. التحقق من الترخيص والشهادات</h2>
                <p>تأكد أن الشركة مسجلة في قائمة المعتمدين من الوكالة الوطنية للتحكم في الطاقة (ANME).</p>
                
                <h2>2. جودة المكونات</h2>
                <p>اسأل عن العلامات التجارية للألواح والعاكس. الألواح من LONGi، Jinko، Canadian Solar هي الأفضل.</p>
                
                <h2>3. زيارة تقنية ميدانية</h2>
                <p>أي شركة تقدم عرض سعر دون زيارة منزلك غير جادة. يجب أن يقوم مهندس بفحص السطح والتظليل.</p>
                
                <h2>4. الضمانات</h2>
                <p>اطلب ضمان المنتج (10-12 سنة) وضمان الأداء (25 سنة).</p>
                
                <h2>5. المراجع والمشاريع السابقة</h2>
                <p>اطلب الاطلاع على مشاريع سابقة في منطقتك.</p>
            `
        },
        'aides-energie-solaire-tunisie-2026': {
            title: 'دعم الدولة للطاقة الشمسية في تونس 2026',
            date: '25 مارس 2026',
            author: 'فريق Shamsi.tn',
            content: `
                <p>تقدم الدولة التونسية عدة برامج لدعم الطاقة الشمسية:</p>
                
                <h2>1. برنامج PROSOL</h2>
                <p>قرض مدعوم من الدولة عبر البنوك المشاركة. يغطي 80% من قيمة النظام مع فائدة مخفضة.</p>
                
                <h2>2. إعفاءات ضريبية</h2>
                <p>إعفاء من الأداء على القيمة المضافة (TVA) بنسبة 100% على معدات الطاقة الشمسية.</p>
                
                <h2>3. تعريفة شراء الكهرباء الفائض</h2>
                <p>يمكن بيع الكهرباء الفائضة إلى STEG بعقود طويلة الأجل.</p>
                
                <h2>4. قروض بنكية ميسرة</h2>
                <p>البنوك التونسية تقدم قروضاً خاصة للطاقة الشمسية بفائدة مدعومة.</p>
            `
        },
        'prosol-financement-solaire-tunisie': {
            title: 'PROSOL: كل ما تحتاج معرفته عن تمويل الطاقة الشمسية',
            date: '20 مارس 2026',
            author: 'فريق Shamsi.tn',
            content: `
                <p>PROSOL هو برنامج وطني تونسي يهدف إلى تشجيع تركيب أنظمة الطاقة الشمسية للمنازل والشركات.</p>
                
                <h2>كيف يعمل PROSOL؟</h2>
                <ul>
                    <li>العميل يدفع 20% من قيمة النظام كمساهمة شخصية</li>
                    <li>البنك يمول 80% المتبقية عبر قرض بفائدة مدعومة</li>
                    <li>يتم سداد القرض على أقساط شهرية لمدة تصل إلى 7 سنوات</li>
                    <li>المنحة تُصرف للشركة المعتمدة وليس للعميل مباشرة</li>
                </ul>
                
                <h2>البنوك المشاركة:</h2>
                <ul>
                    <li>BNA (البنك الوطني الفلاحي)</li>
                    <li>BH (بنك الإسكان)</li>
                    <li>ATB (العرب لتونس للبنك)</li>
                    <li>STB (البنك التونسي للتضامن)</li>
                    <li>BIAT (البنك الدولي العربي لتونس)</li>
                </ul>
                
                <h2>الشروط:</h2>
                <ul>
                    <li>ملكية العقار أو عقد إيجار طويل الأجل</li>
                    <li>موافقة STEG على ربط النظام بالشبكة</li>
                    <li>التركيب بواسطة شركة معتمدة من ANME</li>
                </ul>
            `
        },
        'solaire-agricole-tunisie': {
            title: 'الطاقة الشمسية للمزارع: حل اقتصادي وبيئي',
            date: '15 مارس 2026',
            author: 'فريق Shamsi.tn',
            content: `
                <p>المزارع في تونس تستهلك كميات كبيرة من الكهرباء لتشغيل المضخات والتبريد. الطاقة الشمسية توفر حلاً مثالياً.</p>
                
                <h2>فوائد الطاقة الشمسية للمزارع:</h2>
                <ul>
                    <li>توفير يصل إلى 70% من فاتورة الكهرباء</li>
                    <li>استقلالية في توفير الطاقة</li>
                    <li>تشغيل المضخات خلال النهار مجاناً</li>
                    <li>زيادة قيمة العقار</li>
                </ul>
                
                <h2>دراسة جدوى لمزرعة نموذجية:</h2>
                <ul>
                    <li>نظام 6 كيلوواط لتشغيل مضخة ماء</li>
                    <li>سعر النظام: 18,000 دينار</li>
                    <li>التوفير السنوي: 3,600 دينار</li>
                    <li>مدة استرجاع المال: 5 سنوات</li>
                </ul>
                
                <p>يمكن للمزارع الاستفادة من برنامج PROSOL وبرامج دعم خاصة بالقطاع الفلاحي.</p>
            `
        }
    };
    
    const post = posts[slug] || posts['cout-energie-solaire-tunisie-2026'];
    
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Link to="/blog" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6">
                    <FaArrowRight /> العودة إلى المدونة
                </Link>
                
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{post.title}</h1>
                    
                    <div className="flex items-center gap-4 text-gray-500 mb-8 pb-4 border-b">
                        <span className="flex items-center gap-1"><FaCalendarAlt /> {post.date}</span>
                        <span className="flex items-center gap-1"><FaUser /> {post.author}</span>
                    </div>
                    
                    <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                    
                    <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-center text-yellow-800">
                            💡 هل تريد دراسة مجانية لمنزلك؟ <Link to="/calculator" className="font-bold underline">احسب تكلفة الطاقة الشمسية الآن</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogPost;