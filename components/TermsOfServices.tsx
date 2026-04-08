import { useState } from 'react';
import { createPortal } from 'react-dom';

const texts = [
  {
    "title": "Introduction and Agreement",
    "text": `These Terms of Use ("Terms") constitute a binding agreement between you ("User" or "you") and the open-source contributors and community members (collectively, "Inverse Finance" "we," or the "DAO") who maintain the web interface located at earn.inverse.finance (the "Interface").`
  },
  {
    "warning": "By accessing the Interface, you acknowledge and agree that:"
  },
  {
    "list": [
      "It is non-Custodial: You retain full control of your assets and private keys.",
      "There are no Fiduciary Duties: The contributors, developers, governance participants, and token holders associated with f(x) Protocol do not owe you any fiduciary duty. Nothing in the Interface or Protocol creates any relationship of trust, agency, advisory, or fiduciary obligation.",
      "Assumption of Risk: You understand the inherent risks of DeFi, including smart contract bugs and market volatility."
    ]
  },
  {
    "warning": "If you do not agree to these terms, do not use the interface."
  },
  {
    "title": "Eligibility and Prohibited Jurisdictions",
    "list": [
      "You must be at least 18 years old.",
      "You must not be a resident, citizen, or agent of prohibited jurisdictions.",
      "You must not be on any sanctions list."
    ]
  },
  {
    "subtitle": "Prohibited Jurisdictions",
    "list": [
      "United States",
      "Canada",
      "UAE",
      "UK",
      "Other sanctioned countries (OFAC, UN, EU)"
    ]
  },
  {
    "text": "Access may be restricted via geoblocking. Use of VPNs to circumvent restrictions is prohibited."
  },
  {
    "title": "The Interface vs. The Protocol",
    "subtitle": "The Protocol",
    "text": `A set of immutable smart contracts running on a public blockchain. The DAO cannot "pause" or "reverse" the Protocol once deployed (unless specific governance parameters allow, which are also public).`
  },
  {
    "subtitle": "The Interface",
    "text": "The website you are currently viewing. It is merely a visualizer that helps you format transactions. You can interact with the Protocol directly (e.g., via an explorer) without this Interface."
  },
  {
    "subtitle": "Third-Party Dependencies",
    "text": "Third-Party Dependencies: The Interface and the Protocol may rely on third-party services or infrastructure, including but not limited to wallet providers, blockchain nodes, indexing services, oracle providers, or other external software. We do not control and are not responsible for the operation, availability, accuracy, or security of such third-party services.",
    "list": [
      "Wallet providers",
      "Blockchain nodes",
      "Indexing services",
      "Oracle providers",
      "External infrastructure",
      "Swap routing providers",
    ]
  },
  {
    "title": "Prohibited Activities",
    "list": [
      "Circumventing geoblocking via VPN",
      "Money laundering",
      "Terrorist financing"
    ]
  },
  {
    "title": "Assumption of Risk",
    "list": [
      "Smart contract vulnerabilities and loss of funds",
      "No insurance coverage",
      "Regulatory risks",
      "Irreversible blockchain transactions"
    ]
  },
  {
    "title": "No Advice",
    "text": "Nothing on the Interface constitutes financial, investment, legal, or tax advice. Users should consult professional advisors."
  },
  {
    "title": "No Warranties",
    "warning": `THE INTERFACE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE INTERFACE WILL BE ERROR-FREE OR UNINTERRUPTED.`,
  },
  {
    "list": [
      "No guarantee of merchantability",
      "No guarantee of fitness for a particular purpose",
      "No guarantee of non-infringement",
      "No guarantee of uninterrupted or error-free service"
    ]
  },
  {
    "title": "Limitation of Liability",
    "list": [
      "No liability for indirect, consequential, or incidental damages",
      "No liability for loss of funds",
      "No liability for smart contract exploits, wallet compromise, or user error"
    ]
  },
  {
    "text": "Applies to all legal theories including contract, tort, negligence, and strict liability."
  },
  {
    "warning": "DAO participants are not personally liable and cannot be treated as a general partnership."
  },
  {
    "title": "Indemnification",
    "text": "You agree to indemnify and hold harmless the DAO and its contributors from any claims, damages, or expenses arising from your use or violation of these Terms."
  },
  {
    "title": "Dispute Resolution",
    "subtitle": "Binding Arbitration",
    "text": "Disputes will be resolved through individual binding arbitration."
  },
  {
    "subtitle": "Class Action Waiver",
    "warning": "You waive the right to participate in class actions or class-wide arbitration."
  },
  {
    "title": "Modification of Terms",
    "text": "Terms may be modified at any time and updates will be posted on the Interface. Continued use constitutes acceptance."
  }
];

const Title = ({ text }) => {
  return <p className="text-lg font-bold mb-2">{text}</p>
}

const Subtitle = ({ text }) => {
  return <p className="text-md font-bold mb-1">{text}</p>
}

const Text = ({ text }) => {
  return <p className="text-sm">{text}</p>
}

const List = ({ list }) => {
  return <ul className="py-1">
    {list.map((v, i) => {
      return <li key={i}>
        <Text text={`- ${v}`} />
      </li>
    })}
  </ul>
}

const Warning = ({ text }) => {
  return <p className="text-sm text-accent py-1"><b>Note</b>: {text}</p>
}

export const TermsOfServices = ({
  items = texts
}) => {
  return <div className="card-shine relative bg-card-bg border border-white/[0.05] rounded-2xl p-4">
    <p className="text-xl font-extrabold mb-3">Terms of Services:</p>
    <div className="overflow-auto flex flex-col gap-0 max-h-[300px]">
      {
        items.map((v, i) => {
          return <>
            {
              !!v.title && <Title text={v.title} />
            }
            {
              !!v.subtitle && <Subtitle text={v.subtitle} />
            }
            {
              !!v.text && <Text text={v.text} />
            }
            {
              !!v.warning && <Warning text={v.warning} />
            }
            {
              !!v.list && <List list={v.list} />
            }
          </>
        })
      }
      <div className="flex flex-row gap-1 mt-2 cursor-pointer">
        <input className="cursor-pointer" id="tos-checkbox" type="checkbox" />
        <label className="cursor-pointer" htmlFor="tos-checkbox">I fully agree with the Terms of Services</label>
      </div>
    </div>
  </div>
}

export const TOS_STORAGE_KEY = 'tos-accepted';

export const TermsModal = ({ onAccept, onClose }: { onAccept: () => void; onClose: () => void }) => {
  const [checked, setChecked] = useState(false);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card-shine relative bg-card-bg border border-white/[0.05] rounded-2xl p-6 w-full max-w-lg flex flex-col gap-4 max-h-[90vh]">
        <div className="flex items-center justify-between">
          <p className="text-xl font-extrabold">Terms of Services</p>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-foreground transition-colors cursor-pointer text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-0 flex-1 min-h-0 pr-1" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {texts.map((v, i) => (
            <span key={i}>
              {!!v.title && <Title text={v.title} />}
              {!!v.subtitle && <Subtitle text={v.subtitle} />}
              {!!v.text && <Text text={v.text} />}
              {!!v.warning && <Warning text={v.warning} />}
              {!!v.list && <List list={v.list} />}
            </span>
          ))}
        </div>

        <div className="border-t border-white/[0.05] pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setChecked(v => !v)}>
            <input
              id="tos-modal-checkbox"
              type="checkbox"
              className="cursor-pointer w-4 h-4 accent-orange-400"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              onClick={e => e.stopPropagation()}
            />
            <label className="cursor-pointer text-sm select-none">
              I accept the Terms of Services
            </label>
          </div>
          <button
            disabled={!checked}
            onClick={onAccept}
            className={`w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 ${
              checked
                ? 'btn-primary text-[#1A0E00] cursor-pointer'
                : 'bg-white/[0.04] text-text-muted cursor-not-allowed border border-white/[0.04]'
            }`}
          >
            Agree & Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};