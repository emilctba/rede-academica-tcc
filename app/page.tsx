"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type PostItem = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name?: string } | { full_name?: string }[] | null;
  likes?: { user_id: string }[];
  comments?: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles?: { full_name?: string } | { full_name?: string }[] | null;
  }[];
};

type TccItem = {
  id: string;
  title: string;
  authors: string;
  file_url: string;
  created_at?: string;
};

type QuestionnaireItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  created_at?: string;
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const [page, setPage] = useState<"inicio" | "feed" | "tccs" | "questionarios" | "perfil">("inicio");
  const [studentClassName, setStudentClassName] = useState("Estudante");
  const [profileSaving, setProfileSaving] = useState(false);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postText, setPostText] = useState("");
  const [publishingPost, setPublishingPost] = useState(false);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const user = session?.user ?? null;
  const isAuthenticated = Boolean(user);
  const currentStudentName = isAuthenticated
    ? user.user_metadata?.full_name || user.email || "Estudante"
    : "Visitante";

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      if (data.session?.user) {
        setGuestMode(false);
        setStudentClassName(data.session.user.user_metadata?.student_class || "Estudante");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      if (newSession?.user) {
        setGuestMode(false);
        setStudentClassName(newSession.user.user_metadata?.student_class || "Estudante");
        setPassword("");
      } else {
        setPage("inicio");
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadPosts() {
    setPostsLoading(true);

    const { data, error: fetchError } = await supabase
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

    if (fetchError) {
      console.error("Erro ao carregar publicações:", fetchError.message);
    } else {
      setPosts((data as PostItem[]) || []);
    }

    setPostsLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated || guestMode) {
      loadPosts();
    }
  }, [isAuthenticated, guestMode]);

  function requireAuth(actionLabel: string) {
    if (!user) {
      alert(`Faça login para ${actionLabel}.`);
      return false;
    }
    return true;
  }

  function enterLoginScreen(mode: "login" | "register" | "reset" = "login") {
    setAuthMode(mode);
    setGuestMode(false);
    setError("");
    setMessage("");
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSending(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
    } else {
      setPassword("");
      setGuestMode(false);
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

    const { data, error: signUpError } = await supabase.auth.signUp({
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

    setPassword("");

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.session) {
      setGuestMode(false);
      setMessage("Cadastro realizado com sucesso!");
    } else {
      setMessage("Cadastro realizado! Confira seu e-mail para confirmar sua conta.");
      setAuthMode("login");
    }

    setSending(false);
  }

  async function handlePasswordReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSending(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: window.location.origin,
      }
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Enviamos um link de recuperação para seu e-mail.");
    }

    setSending(false);
  }

  async function handleLogout() {
    setError("");
    setMessage("");
    setGuestMode(false);
    setAuthMode("login");
    setPage("inicio");

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
  }

  async function publishPost() {
    if (!requireAuth("criar publicações")) return;
    if (!postText.trim() || publishingPost) return;

    setPublishingPost(true);
    const { error: insertError } = await supabase.from("posts").insert({
      content: postText.trim(),
      user_id: user.id,
    });

    if (insertError) {
      alert("Erro ao publicar: " + insertError.message);
      setPublishingPost(false);
      return;
    }

    setPostText("");
    setPublishingPost(false);
    await loadPosts();
  }

  async function toggleLike(postId: string, liked: boolean) {
    if (!requireAuth("curtir publicações")) return;

    if (liked) {
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (deleteError) {
        alert("Erro ao remover curtida: " + deleteError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (insertError) {
        alert("Não foi possível curtir: " + insertError.message);
        return;
      }
    }

    await loadPosts();
  }

  async function addReply(postId: string) {
    if (!requireAuth("responder publicações")) return;

    const text = replyTexts[postId]?.trim();
    if (!text) return;

    const { error: replyError } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text,
    });

    if (replyError) {
      alert("Erro ao responder: " + replyError.message);
      return;
    }

    setReplyTexts((old) => ({
      ...old,
      [postId]: "",
    }));

    await loadPosts();
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

  if (!isAuthenticated && !guestMode) {
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
              Compartilhe conhecimento, desenvolva seu TCC e conecte-se com a
              comunidade acadêmica do IF Baiano.
            </p>
          </div>

          <div className="auth-decoration-footer">
            Plataforma acadêmica • Campus Uruçuca
          </div>
        </div>

        <div className="auth-form-area">
          <div className="auth-form">
            <div className="auth-mobile-logo">🎓 REDE ACADÊMICA</div>

            <span className="auth-eyebrow">IF BAIANO • CAMPUS URUÇUCA</span>

            {authMode === "login" && (
              <>
                <h2>Bem-vindo de volta!</h2>
                <p>Entre na sua conta para publicar, curtir e participar.</p>

                <form onSubmit={handleLogin} method="post" autoComplete="on">
                  <label htmlFor="login-email">E-mail institucional ou pessoal</label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <label htmlFor="login-password">Senha</label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button type="submit" className="auth-submit" disabled={sending}>
                    {sending ? "Entrando..." : "Entrar na plataforma →"}
                  </button>
                </form>

                <div className="auth-actions-row">
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => {
                      setAuthMode("reset");
                      setError("");
                      setMessage("");
                    }}
                  >
                    Esqueci minha senha
                  </button>

                  <button
                    type="button"
                    className="auth-guest-btn"
                    onClick={() => {
                      setError("");
                      setMessage("");
                      setPage("inicio");
                      setGuestMode(true);
                    }}
                  >
                    Entrar sem fazer login
                  </button>
                </div>

                <div className="auth-switch">
                  Ainda não tem conta?
                  <button
                    type="button"
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

                <form onSubmit={handleRegister} method="post" autoComplete="on">
                  <label htmlFor="register-name">Nome completo</label>
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome completo"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />

                  <label htmlFor="register-class">Turma / Curso</label>
                  <input
                    id="register-class"
                    name="class"
                    type="text"
                    placeholder="Ex.: 3º Informática"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    required
                  />

                  <label htmlFor="register-email">E-mail</label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <label htmlFor="register-password">Senha</label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo de 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />

                  <button type="submit" className="auth-submit" disabled={sending}>
                    {sending ? "Criando conta..." : "Criar minha conta →"}
                  </button>
                </form>

                <div className="auth-switch">
                  Já possui uma conta?
                  <button
                    type="button"
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

                <form onSubmit={handlePasswordReset} method="post" autoComplete="on">
                  <label htmlFor="reset-email">Seu e-mail</label>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <button type="submit" className="auth-submit" disabled={sending}>
                    {sending ? "Enviando..." : "Enviar link de recuperação"}
                  </button>
                </form>

                <div className="auth-switch">
                  <button
                    type="button"
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

  const menu: { id: "inicio" | "feed" | "tccs" | "questionarios" | "perfil"; icon: string; label: string }[] = [
    { id: "inicio", icon: "🏠", label: "Início" },
    { id: "feed", icon: "💬", label: "Feed acadêmico" },
    { id: "tccs", icon: "📚", label: "Repositório de TCCs" },
    { id: "questionarios", icon: "📊", label: "Questionários" },
    ...(isAuthenticated
      ? [{ id: "perfil" as const, icon: "👤", label: "Meu perfil" }]
      : []),
  ];

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

        <div className="campus">IF BAIANO • CAMPUS URUÇUCA</div>

        <nav>
          {menu.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              style={{
                background: page === item.id ? "#e7f5ec" : "transparent",
                color: page === item.id ? "#176b3a" : "#718078",
                fontWeight: page === item.id ? 800 : 600,
              }}
            >
              {item.icon} &nbsp; {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>🎓 {currentStudentName}</strong>
          <p>{isAuthenticated ? studentClassName : "Modo visitante (leitura)"}</p>
          {isAuthenticated ? (
            <button type="button" className="btn-secondary" onClick={handleLogout}>
              Sair da conta
            </button>
          ) : (
            <button type="button" onClick={() => enterLoginScreen("login")}>
              Fazer login →
            </button>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <strong>Rede Acadêmica TCC</strong>
          <div className="top-user">
            {isAuthenticated ? (
              <>
                <span>●</span> Conta conectada
              </>
            ) : (
              <>
                <span className="guest-dot">●</span> Modo visitante
              </>
            )}
          </div>
        </header>

        <main className="content">
          {!isAuthenticated && (
            <div className="guest-banner">
              <div>
                <strong>Você está navegando sem login.</strong>
                <p>
                  A leitura está liberada, mas curtir, responder ou publicar exige login.
                </p>
              </div>
              <button type="button" onClick={() => enterLoginScreen("login")}>
                Entrar ou criar conta
              </button>
            </div>
          )}

          {page === "inicio" && (
            <>
              <section className="welcome">
                <span>IF BAIANO • CAMPUS URUÇUCA</span>
                <h1>Olá, {currentStudentName.split(" ")[0]}! 👋</h1>
                <h2>Bem-vindo à Rede Acadêmica.</h2>
                <p>
                  Compartilhe conhecimentos, desenvolva seu TCC e conecte-se com
                  outros estudantes.
                </p>
                <button type="button" onClick={() => setPage("feed")}>
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
                      (total, post) => total + (post.likes?.length || 0),
                      0
                    )}
                  </strong>
                  <span>Curtidas</span>
                </div>
                <div>
                  <strong>
                    {posts.reduce(
                      (total, post) => total + (post.comments?.length || 0),
                      0
                    )}
                  </strong>
                  <span>Respostas</span>
                </div>
              </div>

              <h2 className="section-title">Acesse a plataforma</h2>

              {menu.slice(1).map((item) => (
                <div className="card" key={item.id}>
                  <strong>
                    {item.icon} {item.label}
                  </strong>
                  <p>Acesse esta área da comunidade acadêmica.</p>
                  <button type="button" onClick={() => setPage(item.id)}>
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

              {isAuthenticated ? (
                <div className="card">
                  <h3>✍️ Criar publicação</h3>

                  <textarea
                    placeholder="O que você gostaria de compartilhar?"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                  />

                  <button
                    type="button"
                    disabled={publishingPost || !postText.trim()}
                    onClick={publishPost}
                  >
                    {publishingPost ? "Publicando..." : "Publicar →"}
                  </button>
                </div>
              ) : (
                <div className="card locked-card">
                  <h3>🔒 Publicações bloqueadas para visitantes</h3>
                  <p>
                    Entre na sua conta para criar publicações, curtir e responder.
                  </p>
                  <button type="button" onClick={() => enterLoginScreen("login")}>
                    Fazer login para publicar →
                  </button>
                </div>
              )}

              <h2 className="section-title">Mural da comunidade</h2>

              {postsLoading && <p>Carregando publicações...</p>}

              {!postsLoading && posts.length === 0 && (
                <div className="card">
                  <p>Ainda não existem publicações. Seja o primeiro!</p>
                </div>
              )}

              {posts.map((post) => {
                const liked = Boolean(
                  user && post.likes?.some((like) => like.user_id === user.id)
                );

                const repliesOpen = expandedReplies.includes(post.id);

                const author = Array.isArray(post.profiles)
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
                        type="button"
                        onClick={() => toggleLike(post.id, liked)}
                        style={{
                          background: liked ? "#e7f5ec" : "#176b3a",
                          color: liked ? "#176b3a" : "white",
                        }}
                      >
                        {liked ? "♥ Curtido" : "♡ Curtir"} ·{" "}
                        {post.likes?.length || 0}
                      </button>

                      <button
                        type="button"
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

                        {post.comments?.map((comment) => {
                          const commentAuthor = Array.isArray(comment.profiles)
                            ? comment.profiles[0]?.full_name
                            : comment.profiles?.full_name;

                          return (
                            <div className="reply" key={comment.id}>
                              <strong>{commentAuthor || "Estudante"}</strong>
                              <p>{comment.content}</p>
                            </div>
                          );
                        })}

                        {isAuthenticated ? (
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

                            <button type="button" onClick={() => addReply(post.id)}>
                              Enviar
                            </button>
                          </div>
                        ) : (
                          <p className="locked-inline">
                            Faça login para enviar uma resposta.{" "}
                            <button
                              type="button"
                              className="inline-link-btn"
                              onClick={() => enterLoginScreen("login")}
                            >
                              Entrar agora
                            </button>
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </>
          )}

          {page === "tccs" && (
            <TccRepository
              userId={user?.id ?? null}
              onRequireLogin={() => enterLoginScreen("login")}
            />
          )}

          {page === "questionarios" && (
            <QuestionnaireSection
              userId={user?.id ?? null}
              onRequireLogin={() => enterLoginScreen("login")}
            />
          )}

          {page === "perfil" && isAuthenticated && (
            <section className="card profile">
              <div className="profile-avatar">
                {currentStudentName.charAt(0).toUpperCase()}
              </div>

              <h2>{currentStudentName}</h2>
              <p>{user.email}</p>

              <label htmlFor="profile-name">Nome completo</label>
              <input id="profile-name" value={currentStudentName} disabled />

              <label htmlFor="profile-class">Turma / Curso</label>
              <input
                id="profile-class"
                value={studentClassName}
                onChange={(e) => setStudentClassName(e.target.value)}
              />

              <div className="profile-actions">
                <button
                  type="button"
                  disabled={profileSaving}
                  onClick={async () => {
                    setProfileSaving(true);
                    const { error: updateError } = await supabase.auth.updateUser({
                      data: {
                        full_name: currentStudentName,
                        student_class: studentClassName.trim() || "Estudante",
                      },
                    });
                    setProfileSaving(false);

                    if (updateError) {
                      alert(updateError.message);
                    } else {
                      alert("Perfil atualizado!");
                    }
                  }}
                >
                  {profileSaving ? "Salvando..." : "Salvar perfil"}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleLogout}
                >
                  Sair da conta
                </button>
              </div>
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

function TccRepository({
  userId,
  onRequireLogin,
}: {
  userId: string | null;
  onRequireLogin: () => void;
}) {
  const [items, setItems] = useState<TccItem[]>([]);
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
      setItems((data as TccItem[]) || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadTcc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) {
      alert("Faça login para cadastrar um TCC.");
      return;
    }

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

    const { data: urlData } = supabase.storage.from("tccs").getPublicUrl(path);

    const { error: insertError } = await supabase.from("tccs").insert({
      title: title.trim(),
      authors: authors.trim(),
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

      {userId ? (
        <form className="card" onSubmit={uploadTcc}>
          <h3>📄 Cadastrar novo TCC</h3>

          <label htmlFor="tcc-title">Título do trabalho</label>
          <input
            id="tcc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título completo do TCC"
            required
          />

          <label htmlFor="tcc-authors">Autores</label>
          <input
            id="tcc-authors"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            placeholder="Nome dos autores"
            required
          />

          <label htmlFor="tcc-file">Arquivo PDF (máximo 15 MB)</label>
          <input
            id="tcc-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />

          <button disabled={loading} type="submit">
            {loading ? "Enviando PDF..." : "Enviar trabalho →"}
          </button>
        </form>
      ) : (
        <div className="card locked-card">
          <h3>🔒 Envio de TCC restrito a contas logadas</h3>
          <p>Entre na sua conta para cadastrar um trabalho no repositório.</p>
          <button type="button" onClick={onRequireLogin}>
            Fazer login para enviar →
          </button>
        </div>
      )}

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
        <div className="card">Nenhum TCC cadastrado ainda.</div>
      )}
    </>
  );
}

function QuestionnaireSection({
  userId,
  onRequireLogin,
}: {
  userId: string | null;
  onRequireLogin: () => void;
}) {
  const [items, setItems] = useState<QuestionnaireItem[]>([]);
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
      setItems((data as QuestionnaireItem[]) || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function publishQuestionnaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) {
      alert("Faça login para divulgar um questionário.");
      return;
    }

    const { error } = await supabase.from("questionnaires").insert({
      title: title.trim(),
      description: description.trim(),
      link: link.trim(),
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
      <p className="subtitle">Divulgue suas pesquisas para a comunidade.</p>

      {userId ? (
        <form className="card" onSubmit={publishQuestionnaire}>
          <h3>📋 Divulgar pesquisa</h3>

          <label htmlFor="quest-title">Título</label>
          <input
            id="quest-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da pesquisa"
            required
          />

          <label htmlFor="quest-desc">Descrição</label>
          <textarea
            id="quest-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explique o objetivo da pesquisa"
            required
          />

          <label htmlFor="quest-link">Link do formulário</label>
          <input
            id="quest-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://forms.google.com/..."
            required
          />

          <button type="submit">Divulgar questionário →</button>
        </form>
      ) : (
        <div className="card locked-card">
          <h3>🔒 Divulgação restrita a contas logadas</h3>
          <p>Entre na sua conta para divulgar um novo questionário.</p>
          <button type="button" onClick={onRequireLogin}>
            Fazer login para divulgar →
          </button>
        </div>
      )}

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
        <div className="card">Nenhuma pesquisa divulgada ainda.</div>
      )}
    </>
  );
}
