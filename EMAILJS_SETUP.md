# 📧 Configuration EmailJS - Guide Complet

## Étape 1: Créer ou accéder à votre compte EmailJS

1. Allez sur [emailjs.com](https://emailjs.com/)
2. Connectez-vous ou créez un compte gratuit
3. Acceptez les conditions

## Étape 2: Configurer le Service Email

1. Dans le tableau de bord, cliquez sur **"Email Services"** (ou Services)
2. Créez un nouveau service avec:
   - **Service Name:** Portfolio Service
   - **Service ID:** `service_qw9jmbh`
   - Choisissez votre fournisseur email (Gmail, Outlook, etc.)

> **Important:** L'ID du service DOIT être exactement `service_qw9jmbh`

## Étape 3: Configurer le Template Email

1. Cliquez sur **"Email Templates"** 
2. Créez un nouveau template avec:
   - **Template Name:** Portfolio Template
   - **Template ID:** `template_v2hfsej`

> **Important:** L'ID du template DOIT être exactement `template_v2hfsej`

### Contenu du Template

Dans l'éditeur, utilisez le contenu suivant:

```
Subject: {{subject}}

Bonjour,

Vous avez reçu un nouveau message via votre formulaire de contact:

---

Nom: {{from_name}}
Email: {{from_email}}
Téléphone: {{phone}}
Sujet: {{subject}}

Message:
{{message}}

---

Envoyé via votre portfolio web.
```

> **Variables requises** (doivent correspondre aux noms ci-dessus):
> - `{{to_email}}` - Email destinataire (défini dans le code)
> - `{{from_name}}` - Nom de l'expéditeur
> - `{{from_email}}` - Email de l'expéditeur  
> - `{{phone}}` - Numéro de téléphone
> - `{{subject}}` - Sujet du message
> - `{{message}}` - Corps du message

## Étape 4: Activer les connexions

1. Configurez votre email (Gmail, Outlook, etc.) pour permettre à EmailJS de l'utiliser
2. Suivez les instructions spécifiques à votre fournisseur

## Configuration actuellement utilisée

```javascript
// script.js
const EMAILJS_PUBLIC_KEY = "BpLuCDN7p3VZuCE0X";
const EMAILJS_SERVICE_ID = "service_qw9jmbh";
const EMAILJS_TEMPLATE_ID = "template_v2hfsej";
```

## Tester votre configuration

1. Accédez à votre site web
2. Remplissez le formulaire de contact:
   - **Full Name:** Votre nom
   - **Email Address:** Votre email
   - **Mobile Number:** Votre téléphone (optionnel)
   - **Email Subject:** Un sujet
   - **Your Message:** Votre message

3. Cliquez sur **"Send Message"**

### Résultats attendus

✅ **Succès:** 
- Le bouton affichera "⏳ Envoi en cours..."
- Un message vert s'affichera: "✅ Message envoyé avec succès!"
- Le formulaire se réinitialisera

❌ **Erreur:**
- Un message rouge s'affichera
- Vérifiez la console (F12 > Console) pour les détails d'erreur

## Dépannage

### "EmailJS Error: invalid_apikey"
→ Vérifiez que `EMAILJS_PUBLIC_KEY` est correct dans script.js

### "EmailJS Error: invalid_service_id"
→ Créez ou vérifiez que le service ID est `service_qw9jmbh`

### "EmailJS Error: invalid_template_id"
→ Créez ou vérifiez que le template ID est `template_v2hfsej`

### Les variables du template ne s'affichent pas
→ Assurez-vous que les noms correspondent exactement (majuscules/minuscules)

## Support

- [Documentation EmailJS](https://www.emailjs.com/docs/)
- [Exemples de templates](https://www.emailjs.com/docs/template/)
- [Troubleshooting](https://www.emailjs.com/docs/api/troubleshooting/)
