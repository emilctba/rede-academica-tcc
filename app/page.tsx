
"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type UserProfile = {
  id: string;
  email: string;
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSending(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
    }

    setSending(false);
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (!studentName.trim() || !studentClass.trim()) {
      setError("Preencha seu nome e sua turma.");
      return;
    }

    setSending(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: studentName.trim(),
          student_class: studentClass.trim(),
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      setMessage("Cadastro realizado com sucesso!");
    } else {
      setMessage(
        "Cadastro realizado! Confira seu e-mail para confirmar sua conta."
      );
      setAuthMode("login");
    }

    setSending(false);
  }

  async function handlePasswordReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: window.location.origin,
      }
    );

    if (error) {
      setError(error.message);
    } else {
      setMessage("Enviamos um link de recuperação para seu e-mail.");
    }

    setSending(false);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-logo">🎓</div>
        <h2>Rede Acadêmica TCC</h2>
        <p>Carregando plataforma...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-decoration">
          <div className="auth-brand">
            <span>🎓</span>
            <div>
              <strong>REDE ACADÊMICA</strong>
              <small>IF BAIANO • URUÇUCA</small>
            </div>
          </div>

          <div className="auth-presentation">
            <span>CONHECIMENTO QUE CONECTA</span>
            <h1>Seu espaço para transformar ideias em pesquisas.</h1>
            <p>
              Compartilhe conhecimento, desenvolva seu TCC
              e conecte-se com outros estudantes do IF Baiano.
            </p>
          </div>

          <div className="auth-decoration-footer">
            Plataforma acadêmica • Campus Uruçuca
          </div>
        </div>

        <div className="auth-form-area">
          <div className="auth-form">
            <div className="auth-mobile-logo">🎓 REDE ACADÊMICA</div>

            <span className="auth-eyebrow">
              IF BAIANO • CAMPUS URUÇUCA
            </span>

            {authMode === "login" && (
              <>
                <h2>Bem-vindo de volta!</h2>
                <p>Entre na sua conta para continuar.</p>

                <form onSubmit={handleLogin}>
                  <label>E-mail institucional ou pessoal</label>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <label>Senha</label>
                  <input
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button type="submit" disabled={sending}>
                    {sending ? "Entrando..." : "Entrar na plataforma →"}
                  </button>
                </form>

                <button
                  className="auth-link"
                  onClick={() => {
                    setAuthMode("reset");
                    setError("");
                    setMessage("");
                  }}
                >
                  Esqueci minha senha
                </button>

                <div className="auth-switch">
                  Ainda não tem conta?
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setError("");
                      setMessage("");
                    }}
                  >
                    Criar conta
                  </button>
                </div>
              </>
            )}

            {authMode === "register" && (
              <>
                <h2>Crie sua conta!</h2>
                <p>Faça parte da comunidade acadêmica.</p>

                <form onSubmit={handleRegister}>
                  <label>Nome completo</label>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />

                  <label>Turma / Curso</label>
                  <input
                    type="text"
                    placeholder="Ex.: 3º Informática"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    required
                  />

                  <label>E-mail</label>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <label>Senha</label>
                  <input
                    type="password"
                    placeholder="Mínimo de 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />

                  <button type="submit" disabled={sending}>
                    {sending ? "Criando conta..." : "Criar minha conta →"}
                  </button>
                </form>

                <div className="auth-switch">
                  Já possui uma conta?
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                      setMessage("");
                    }}
                  >
                    Fazer login
                  </button>
                </div>
              </>
            )}

            {authMode === "reset" && (
              <>
                <h2>Recuperar senha</h2>
                <p>Informe seu e-mail para receber o link de recuperação.</p>

                <form onSubmit={handlePasswordReset}>
                  <label>Seu e-mail</label>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <button type="submit" disabled={sending}>
                    {sending ? "Enviando..." : "Enviar link de recuperação"}
                  </button>
                </form>

                <div className="auth-switch">
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                      setMessage("");
                    }}
                  >
                    ← Voltar para login
                  </button>
                </div>
              </>
            )}

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}

            <div className="auth-legal">
              © 2026 Rede Acadêmica TCC
              <br />
              IF Baiano • Campus Uruçuca
            </div>
          </div>
        </div>
      </div>
    );
  }

  const user = session.user;
  const profile: UserProfile = {
    id: user.id,
    email: user.email || "",
  };
  
  const [page, setPage] = useState("inicio");
  const [studentClassName, setStudentClassName] = useState(
    user.user_metadata?.student_class || "Estudante"
  );
  const [posts, setPosts] = useState<any[]>([]);
  const [postText, setPostText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const studentName =
    user.user_metadata?.full_name || user.email || "Estudante";

  const menu = [
    { id: "inicio", icon: "🏠", label: "Início" },
    { id: "feed", icon: "💬", label: "Feed acadêmico" },
    { id: "tccs", icon: "📚", label: "Repositório de TCCs" },
    { id: "questionarios", icon: "📊", label: "Questionários" },
    { id: "perfil", icon: "👤", label: "Meu perfil" },
  ];

  async function loadPosts() {
    setPostsLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles(full_name),
        likes(user_id),
        comments(
          id,
          content,
          created_at,
          user_id,
          profiles(full_name)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar publicações:", error.message);
    } else {
      setPosts(data || []);
    }

    setPostsLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function publishPost() {
    if (!postText.trim()) return;

    const { error } = await supabase.from("posts").insert({
      content: postText.trim(),
      user_id: user.id,
    });

    if (error) {
      alert("Erro ao publicar: " + error.message);
      return;
    }

    setPostText("");
    await loadPosts();
  }

  async function toggleLike(postId: string, liked: boolean) {
    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) {
        alert("Erro ao remover curtida: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (error) {
        alert("Não foi possível curtir: " + error.message);
        return;
      }
    }

    await loadPosts();
  }

  async function addReply(postId: string) {
    const text = replyTexts[postId]?.trim();

    if (!text) return;

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text,
    });

    if (error) {
      alert("Erro ao responder: " + error.message);
      return;
    }

    setReplyTexts((old) => ({
      ...old,
      [postId]: "",
    }));

    await loadPosts();
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span>🎓</span>
          <div>
            <h2>REDE ACADÊMICA</h2>
            <p>PLATAFORMA TCC</p>
          </div>
        </div>

        <div className="campus">
          IF BAIANO • CAMPUS URUÇUCA
        </div>

        <nav>
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                background:
                  page === item.id ? "#e7f5ec" : "transparent",
                color:
                  page === item.id ? "#176b3a" : "#718078",
                fontWeight: page === item.id ? 800 : 600,
              }}
            >
              {item.icon} &nbsp; {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>🎓 {studentName}</strong>
          <p>{studentClassName}</p>
          <button onClick={handleLogout}>
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <strong>Rede Acadêmica TCC</strong>
          <div className="top-user">
            ● Conta conectada
          </div>
        </header>

        <main className="content">

          {page === "inicio" && (
            <>
              <section className="welcome">
                <span>IF BAIANO • CAMPUS URUÇUCA</span>
                <h1>Olá, {studentName.split(" ")[0]}! 👋</h1>
                <h2>Bem-vindo à Rede Acadêmica.</h2>
                <p>
                  Compartilhe conhecimentos, desenvolva seu TCC
                  e conecte-se com outros estudantes.
                </p>
                <button onClick={() => setPage("feed")}>
                  Explorar comunidade →
                </button>
              </section>

              <div className="stats">
                <div>
                  <strong>{posts.length}</strong>
                  <span>Publicações</span>
                </div>
                <div>
                  <strong>
                    {posts.reduce(
                      (total, post) =>
                        total + (post.likes?.length || 0),
                      0
                    )}
                  </strong>
                  <span>Curtidas</span>
                </div>
                <div>
                  <strong>
                    {posts.reduce(
                      (total, post) =>
                        total + (post.comments?.length || 0),
                      0
                    )}
                  </strong>
                  <span>Respostas</span>
                </div>
              </div>

              <h2 className="section-title">
                Acesse a plataforma
              </h2>

              {menu.slice(1).map((item) => (
                <div className="card" key={item.id}>
                  <strong>
                    {item.icon} {item.label}
                  </strong>
                  <p>
                    Acesse esta área da comunidade acadêmica.
                  </p>
                  <button onClick={() => setPage(item.id)}>
                    Acessar →
                  </button>
                </div>
              ))}
            </>
          )}

          {page === "feed" && (
            <>
              <h1>Feed acadêmico 💬</h1>
              <p className="subtitle">
                Compartilhe ideias e converse com outros estudantes.
              </p>

              <div className="card">
                <h3>✍️ Criar publicação</h3>

                <textarea
                  placeholder="O que você gostaria de compartilhar?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />

                <button onClick={publishPost}>
                  Publicar →
                </button>
              </div>

              <h2 className="section-title">
                Mural da comunidade
              </h2>

              {postsLoading && <p>Carregando publicações...</p>}

              {!postsLoading && posts.length === 0 && (
                <div className="card">
                  <p>Ainda não existem publicações. Seja o primeiro!</p>
                </div>
              )}

              {posts.map((post) => {
                const liked = post.likes?.some(
                  (like: any) => like.user_id === user.id
                );

                const repliesOpen =
                  expandedReplies.includes(post.id);

                const author =
                  Array.isArray(post.profiles)
                    ? post.profiles[0]?.full_name
                    : post.profiles?.full_name;

                return (
                  <article className="card" key={post.id}>
                    <div className="post-author">
                      <div className="profile-avatar">
                        {(author || "E").charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{author || "Estudante"}</strong>
                        <p>
                          {new Date(post.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <p>{post.content}</p>

                    <div className="post-actions">
                      <button
                        onClick={() =>
                          toggleLike(post.id, !!liked)
                        }
                        style={{
                          background: liked ? "#e7f5ec" : "#176b3a",
                          color: liked ? "#176b3a" : "white",
                        }}
                      >
                        {liked ? "♥ Curtido" : "♡ Curtir"} ·{" "}
                        {post.likes?.length || 0}
                      </button>

                      <button
                        onClick={() =>
                          setExpandedReplies((old) =>
                            old.includes(post.id)
                              ? old.filter((id) => id !== post.id)
                              : [...old, post.id]
                          )
                        }
                      >
                        💬 Responder · {post.comments?.length || 0}
                      </button>
                    </div>

                    {repliesOpen && (
                      <div className="replies">
                        <h4>Respostas da publicação</h4>

                        {post.comments?.map((comment: any) => {
                          const commentAuthor =
                            Array.isArray(comment.profiles)
                              ? comment.profiles[0]?.full_name
                              : comment.profiles?.full_name;

                          return (
                            <div className="reply" key={comment.id}>
                              <strong>
                                {commentAuthor || "Estudante"}
                              </strong>
                              <p>{comment.content}</p>
                            </div>
                          );
                        })}

                        <div className="reply-form">
                          <input
                            placeholder="Escreva sua resposta..."
                            value={replyTexts[post.id] || ""}
                            onChange={(e) =>
                              setReplyTexts((old) => ({
                                ...old,
                                [post.id]: e.target.value,
                              }))
                            }
                          />

                          <button onClick={() => addReply(post.id)}>
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </>
          )}

          {page === "tccs" && (
            <TccRepository userId={user.id} />
          )}

          {page === "questionarios" && (
            <QuestionnaireSection userId={user.id} />
          )}

          {page === "perfil" && (
            <section className="card profile">
              <div className="profile-avatar">
                {studentName.charAt(0).toUpperCase()}
              </div>

              <h2>{studentName}</h2>
              <p>{user.email}</p>

              <label>Nome completo</label>
              <input
                value={studentName}
                disabled
              />

              <label>Turma / Curso</label>
              <input
                value={studentClassName}
                onChange={(e) =>
                  setStudentClassName(e.target.value)
                }
              />

              <button
                onClick={async () => {
                  const { error } =
                    await supabase.auth.updateUser({
                      data: {
                        full_name: studentName,
                        student_class: studentClassName,
                      },
                    });

                  if (error) {
                    alert(error.message);
                  } else {
                    alert("Perfil atualizado!");
                  }
                }}
              >
                Salvar perfil
              </button>

              <button onClick={handleLogout}>
                Sair da conta
              </button>
            </section>
          )}

          <footer>
            Rede Acadêmica TCC • IF Baiano Campus Uruçuca
            <br />
            Conectando estudantes e conhecimento.
          </footer>
        </main>
      </div>
    </div>
  );
}

function TccRepository({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("tccs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
    } else {
      setItems(data || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadTcc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      alert("Selecione um arquivo PDF.");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Somente arquivos PDF são permitidos.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert("O PDF deve ter no máximo 15 MB.");
      return;
    }

    setLoading(true);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("tccs")
      .upload(path, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      alert("Erro ao enviar PDF: " + uploadError.message);
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("tccs")
      .getPublicUrl(path);

    const { error: insertError } = await supabase
      .from("tccs")
      .insert({
        title,
        authors,
        file_path: path,
        file_url: urlData.publicUrl,
        user_id: userId,
      });

    if (insertError) {
      alert("Erro ao cadastrar TCC: " + insertError.message);
    } else {
      alert("TCC enviado com sucesso!");
      setTitle("");
      setAuthors("");
      setFile(null);
      await load();
    }

    setLoading(false);
  }

  return (
    <>
      <h1>Repositório de TCCs 📚</h1>
      <p className="subtitle">
        Compartilhe trabalhos acadêmicos autorizados.
      </p>

      <form className="card" onSubmit={uploadTcc}>
        <h3>📄 Cadastrar novo TCC</h3>

        <label>Título do trabalho</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título completo do TCC"
          required
        />

        <label>Autores</label>
        <input
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="Nome dos autores"
          required
        />

        <label>Arquivo PDF (máximo 15 MB)</label>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />

        <button disabled={loading} type="submit">
          {loading ? "Enviando PDF..." : "Enviar trabalho →"}
        </button>
      </form>

      <h2 className="section-title">Trabalhos disponíveis</h2>

      {items.map((item) => (
        <article className="card" key={item.id}>
          <span className="tag">TCC AUTORIZADO</span>
          <h3>{item.title}</h3>
          <p>Autores: {item.authors}</p>

          <a
            href={item.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="download-link"
          >
            📄 Abrir PDF
          </a>
        </article>
      ))}

      {items.length === 0 && (
        <div className="card">
          Nenhum TCC cadastrado ainda.
        </div>
      )}
    </>
  );
}

function QuestionnaireSection({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("questionnaires")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
    } else {
      setItems(data || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function publishQuestionnaire(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const { error } = await supabase
      .from("questionnaires")
      .insert({
        title,
        description,
        link,
        user_id: userId,
      });

    if (error) {
      alert("Erro ao divulgar: " + error.message);
    } else {
      alert("Questionário divulgado!");
      setTitle("");
      setDescription("");
      setLink("");
      await load();
    }
  }

  return (
    <>
      <h1>Questionários 📊</h1>
      <p className="subtitle">
        Divulgue suas pesquisas para a comunidade.
      </p>

      <form className="card" onSubmit={publishQuestionnaire}>
        <h3>📋 Divulgar pesquisa</h3>

        <label>Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da pesquisa"
          required
        />

        <label>Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explique o objetivo da pesquisa"
          required
        />

        <label>Link do formulário</label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://forms.google.com/..."
          required
        />

        <button type="submit">
          Divulgar questionário →
        </button>
      </form>

      <h2 className="section-title">Pesquisas disponíveis</h2>

      {items.map((item) => (
        <article className="card" key={item.id}>
          <span className="tag">PESQUISA</span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>

          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="download-link"
          >
            Responder pesquisa →
          </a>
        </article>
      ))}

      {items.length === 0 && (
        <div className="card">
          Nenhuma pesquisa divulgada ainda.
        </div>
      )}
    </>
  );
}

