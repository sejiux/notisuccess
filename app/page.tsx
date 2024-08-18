"use client";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { faker } from '@faker-js/faker'; 

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64); // Utilisation de atob pour décoder base64 en chaîne binaire
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const HomePage = () => {
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [title, setTitle] = useState('Stripe');
  const [body, setBody] = useState('You received a payment of $50 from {{ email }}');
  const [badge, setBadge] = useState('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbrcXXjNUXtyVEFH-YU9svTfDsySwWvPx9ig&s');
  const [url, setUrl] = useState('https://selimmersive.com');
  const [intervalValue, setIntervalValue] = useState(5);
  const [intervalUnit, setIntervalUnit] = useState('seconds');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(async registration => {
          console.log('Service Worker registered with scope:', registration.scope);

          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.info('Notification permission granted.');
            } else {
              console.info('Notification permission denied.');
            }
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [notificationsEnabled]);

  const subscribe = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic ?? "")
    });

    console.info("subscription", subscription);
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });
    setSub(subscription);
  };

  const unsubscribe = async () => {
    if (sub) {
      const registration = await navigator.serviceWorker.ready;
      await registration.pushManager.getSubscription().then(subscription => {
        if (subscription) {
          subscription.unsubscribe().then(() => {
            console.info('Unsubscribed successfully.');
            setSub(null);
          }).catch(error => {
            console.error('Unsubscribe error:', error);
          });
        }
      });
    }
  };

  const handleSwitchChange =  async (checked: boolean) => {
    if (!checked) {
      // Disable notifications
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      await unsubscribe();
      setNotificationsEnabled(false);
    } else {
      // Enable notifications
      if (!sub) {
        await subscribe();
      }
      if (sub) {
        const interval = intervalUnit === 'seconds' ? intervalValue * 1000 : intervalValue * 60000;
        intervalRef.current = setInterval(async () => {
          const email = faker.internet.email(); // Generate a random email
          const messageBody = body.replace('{{ email }}', email); // Replace {{ email }} with the generated email

          await fetch('/api/notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title,
              body: messageBody,
              badge,
              url,
              subscription: sub
            })
          });
        }, interval);
        setNotificationsEnabled(true);
      }
    }
  };

  return (
    <div className='flex flex-col space-y-6 px-8'>
      <h1 className='pt-10 text-xl font-medium'>Notisuccess</h1>
      <div className='space-y-2'>
        <Label>Titre</Label>
        <Input 
          type="text" 
          placeholder="Title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
      </div>
      <div className='space-y-2'>
        <Label>Contenu</Label>
        <Textarea 
          rows={5}
          placeholder="Body" 
          value={body} 
          onChange={(e) => setBody(e.target.value)} 
        />
      </div>
      <div className='space-y-2'>
        <Label>Icone</Label>
        <Input 
          type="text" 
          placeholder="Icon URL" 
          value={badge} 
          onChange={(e) => setBadge(e.target.value)} 
        />
      </div>
      <div className='space-y-2'>
        <Label>Url</Label>
        <Input 
          type="text" 
          placeholder="Click URL" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
        />
      </div>
      <div className='space-y-2'>
        <Label>Intervale</Label>
        <div className="flex gap-2">
          <Input 
            type="number" 
            placeholder="Interval" 
            value={intervalValue} 
            onChange={(e) => setIntervalValue(parseInt(e.target.value))} 
          />
          <Select onValueChange={setIntervalUnit} defaultValue={intervalUnit}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Secondes</SelectItem>
              <SelectItem value="minutes">Minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Switch checked={notificationsEnabled} onCheckedChange={handleSwitchChange} />
        <Label>{notificationsEnabled ? "Désactiver" : "Activer" } les notifications</Label>
      </div>
    </div>
  );
};

export default HomePage;
